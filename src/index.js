import axios from 'axios';
import { ENVIRONMENTS, DEFAULT_SCOPES, ESSENTIAL_CLAIMS } from './constants.js';
import { generateCodeVerifier, generateCodeChallenge, signClientAssertion, decodeJwt } from './crypto.js';

export class FaydaClient {
    /**
     * @param {Object} config
     * @param {string} config.clientId - The Client ID provided by NID
     * @param {string} config.privateKey - RSA Private Key (PEM or Base64)
     * @param {string} [config.environment='UAT'] - 'UAT' or 'PROD'
     * @param {string} [config.redirectUri] - Default Redirect URI
     */
    constructor({ clientId, privateKey, environment = 'UAT', redirectUri }) {
        if (!clientId || !privateKey) {
            throw new Error('FaydaClient: clientId and privateKey are required.');
        }

        this.clientId = clientId;
        this.privateKey = privateKey;
        this.redirectUri = redirectUri;
        
        this.envConfig = ENVIRONMENTS[environment];
        if (!this.envConfig) {
            throw new Error(`Invalid environment: ${environment}. Use 'UAT' or 'PROD'.`);
        }
    }

    /**
     * Generates a crypto-secure Authorization URL and PKCE verifier
     * @param {Object} options
     * @param {string} [options.scope] - Space-separated scopes
     * @param {string} [options.state] - CSRF state token
     * @param {string} [options.redirectUri] - Override default redirect URI
     * @returns {Object} { url, codeVerifier, state }
     */
    getAuthorizationUrl({ scope = DEFAULT_SCOPES, state, redirectUri } = {}) {
        const uri = redirectUri || this.redirectUri;
        if (!uri) throw new Error('redirectUri is required in constructor or method call.');

        const codeVerifier = generateCodeVerifier();
        const codeChallenge = generateCodeChallenge(codeVerifier);
        
        // Generate a random state if not provided
        const finalState = state || generateCodeVerifier(12); 

        const params = new URLSearchParams({
            response_type: 'code',
            client_id: this.clientId,
            scope: scope,
            redirect_uri: uri,
            state: finalState,
            code_challenge: codeChallenge,
            code_challenge_method: 'S256',
            acr_values: this.envConfig.acrValues,
            claims: JSON.stringify(ESSENTIAL_CLAIMS)
        });

        return {
            url: `${this.envConfig.authorizationEndpoint}?${params.toString()}`,
            codeVerifier,
            state: finalState
        };
    }

    /**
     * Exchanges the Authorization Code for User Information
     * @param {string} code - The code received in the callback
     * @param {string} codeVerifier - The PKCE verifier stored in user session
     * @param {string} [redirectUri] - Must match the one used in getAuthorizationUrl
     * @returns {Promise<Object>} The User Profile (decoded JWT)
     */
    async getUser(code, codeVerifier, redirectUri) {
        const uri = redirectUri || this.redirectUri;
        if (!code) throw new Error('Authorization code is required.');
        if (!codeVerifier) throw new Error('PKCE code_verifier is required.');

        try {
            // 1. Generate Client Assertion (Private Key JWT)
            const clientAssertion = await signClientAssertion(
                this.clientId,
                this.envConfig.tokenEndpoint,
                this.privateKey
            );

            // 2. Request Access Token
            const tokenParams = new URLSearchParams({
                grant_type: 'authorization_code',
                code,
                redirect_uri: uri,
                client_id: this.clientId,
                client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
                client_assertion: clientAssertion,
                code_verifier: codeVerifier
            });

            const tokenRes = await axios.post(
                this.envConfig.tokenEndpoint,
                tokenParams.toString(),
                { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
            );

            const { access_token } = tokenRes.data;

            // 3. Fetch User Info
            // Note: Standard OIDC UserInfo is GET with Bearer token
            const userRes = await axios.get(
                this.envConfig.userInfoEndpoint,
                { 
                    headers: { 
                        'Authorization': `Bearer ${access_token}`,
                        'Content-Type': 'application/json' 
                    } 
                }
            );

            // 4. Decode the Identity JWT
            // The response might be a JWT string directly or a JSON with a JWT property
            // NID usually returns a signed JWT as the body.
            const responseBody = userRes.data;
            let userData;

            if (typeof responseBody === 'string') {
                // It's a JWT
                userData = decodeJwt(responseBody);
            } else if (responseBody && typeof responseBody === 'object') {
                 // Might be { "jwt": "..." } or plain JSON (unlikely for Fayda eSignet)
                 // If it's standard OIDC JSON, return it. If it looks like a JWT, decode it.
                 userData = responseBody; 
            }

            return userData;

        } catch (error) {
            if (error.response) {
                const errMsg = error.response.data?.error_description || error.response.data?.error || error.message;
                throw new Error(`Fayda API Error: ${errMsg}`);
            }
            throw error;
        }
    }
}
