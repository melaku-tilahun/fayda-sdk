import { importJWK, importPKCS8, SignJWT, jwtVerify } from 'jose';
import crypto from 'crypto';

/**
 * Generates a high-entropy random string for PKCE code_verifier
 * @param {number} length 
 * @returns {string}
 */
export const generateCodeVerifier = (length = 43) => {
    return base64UrlEncode(crypto.randomBytes(length));
};

/**
 * Generates the SHA-256 code_challenge for the verifier
 * @param {string} verifier 
 * @returns {string}
 */
export const generateCodeChallenge = (verifier) => {
    const hash = crypto.createHash('sha256').update(verifier).digest();
    return base64UrlEncode(hash);
};

/**
 * Base64URL encoding helper (removes +, /, =)
 * @param {Buffer} buffer 
 * @returns {string}
 */
const base64UrlEncode = (buffer) => {
    return buffer.toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
};

/**
 * Signs a Private Key JWT (Client Assertion)
 * @param {string} clientId 
 * @param {string} tokenEndpoint 
 * @param {string} privateKeyInput - PEM string or Base64 encoded key
 * @returns {Promise<string>} Signed JWT
 */
export const signClientAssertion = async (clientId, tokenEndpoint, privateKeyInput) => {
    let privateKey;

    try {
        // Handle Base64 encoded keys (common in .env)
        if (!privateKeyInput.includes('-----BEGIN')) {
            const decoded = Buffer.from(privateKeyInput, 'base64').toString();
            // If the decoded string looks like a PEM, use it
            if (decoded.includes('-----BEGIN')) {
                privateKeyInput = decoded;
            } else {
                // Try JSON JWK parsing
                try {
                    const jwk = JSON.parse(decoded);
                    privateKey = await importJWK(jwk, 'RS256');
                } catch (e) {
                    // Assume raw PKCS8 if not JSON
                    privateKey = await importPKCS8(decoded, 'RS256');
                }
            }
        }
        
        if (!privateKey) {
             privateKey = await importPKCS8(privateKeyInput, 'RS256');
        }

    } catch (error) {
        throw new Error(`Failed to import private key: ${error.message}`);
    }

    const jwt = await new SignJWT({
        iss: clientId,
        sub: clientId,
        aud: tokenEndpoint,
        jti: crypto.randomBytes(16).toString('hex')
    })
        .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
        .setIssuedAt()
        .setExpirationTime('5m') // Short expiration for assertion
        .sign(privateKey);

    return jwt;
};

/**
 * Decodes and verifies a JWT (without signature verification for now if public key not provided, 
 * but primarily for extracting the payload safely)
 * Note: specific Fayda verification might need their public key
 * @param {string} token 
 * @returns {object} Payload
 */
export const decodeJwt = (token) => {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        return JSON.parse(jsonPayload);
    } catch (e) {
        throw new Error('Invalid JWT format');
    }
};
