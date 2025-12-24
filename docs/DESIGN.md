# Project Design Document: `fayda-sdk`

**Version:** 1.0
**Status:** Approved for Implementation

---

## 1. Problem Analysis

### 1.1 The Context
The Ethiopian National ID Program (Fayda) utilizes **MOSIP eSignet**, an open-standard identity platform based on **OIDC (OpenID Connect)** and **OAuth 2.0**. While these are robust international standards, they introduce significant implementation complexity for client applications ("Relying Parties").

### 1.2 The Core Problems
1.  **Cryptographic Complexity**: Authenticating with Fayda requires **Private Key JWT** authentication (RFC 7523). Implementing this manually requires developers to:
    -   Manage RSA private keys.
    -   Construct JWT headers and payloads correctly.
    -   Sign payloads using RSA-SHA256.
    -   *Risk:* Incorrect implementation leads to authentication failures or security vulnerabilities (e.g., weak signatures).

2.  **PKCE Implementation**: To secure the authorization code flow, **PKCE (Proof Key for Code Exchange)** is required. This involves:
    -   Generating a high-entropy random string (`code_verifier`).
    -   Hashing it with SHA-256 and Base64Url-encoding it to create the `code_challenge`.
    -   Mismatching these steps causes the "invalid_grant" errors that thwart many integrations.

3.  **Data Decoding Friction**: Fayda returns user identity information as a **Signed JWT** (JWS). Developers often struggle to verify the signature and decode the payload to access simple fields like "Name" or "Phone".

4.  **Security Liability**: Manual implementation increases the surface area for mistakes, such as mishandling private keys, reusing nonces, or failing to validate the `aud` (audience) claim in tokens.

---

## 2. Proposed Solution: `fayda-sdk`

To address these challenges, we propose the development of **`fayda-sdk`**: a minimalist, secure-by-default Node.js library.

### 2.1 Core Philosophy
-   **Abstraction**: Hide the "plumbing" (crypto, OIDC specs) and expose the "intent" (login, get user).
-   **Security**: Enforce best practices (PKCE, RSA signing) automatically.
-   **Zero-Config Defaults**: Pre-configured endpoints for UAT and PROD environments.

### 2.2 Solution Architecture

The SDK acts as a middleware layer between the Developer's Backend and the Fayda eSignet Server.

```mermaid
graph TD
    ClientApp[Client Application] -->|1. getAuthorizationUrl()| SDK[fayda-sdk]
    SDK -->|2. Generate PKCE & URL| ClientApp
    ClientApp -->|3. Redirect User| Fayda[Fayda eSignet]
    Fayda -->|4. Auth Code| ClientApp
    ClientApp -->|5. exchangeCodeForUser(code)| SDK
    SDK -->|6. Sign Private Key JWT| SDK
    SDK -->|7. Exchange Token / UserInfo| Fayda
    Fayda -->|8. Signed Identity JWT| SDK
    SDK -->|9. Verify & Decode| ClientApp
```

---

## 3. Technical Implementation Details

### 3.1 Technology Stack
-   **Platform**: Node.js (Compatible with CommonJS and ESM).
-   **Cryptography Engine**: `jose` (A widely auditied, standard-compliant library for JWT/JWA/JWE).
-   **HTTP Client**: `axios` (For robust HTTP requests to Fayda endpoints).

### 3.2 Key Technical Features

#### A. Automated Client Assertion
Instead of asking developers to sign tokens, the SDK requires only the Private Key.
*Internal Logic:*
1.  Derive the Public Key ID (kid) if needed.
2.  Construct the JWT Header (`{ alg: 'RS256', typ: 'JWT' }`).
3.  Construct the Payload with required claims (`iss`, `sub`, `aud`, `exp`, `jti`).
4.  Sign using `jose.SignJWT`.

#### B. PKCE Lifecycle Management
The SDK provides a helper to generate the `verifier` and `challenge` pair using Node's native `crypto` module, ensuring cryptographic randomness.

#### C. Identity Unwrapping
The `FaydaClient` class includes a method `getUserInfo()` that:
1.  Fetches the opaque `access_token`.
2.  Calls the UserInfo endpoint.
3.  Receives the standard OIDC response.
4.  *Crucially*, parses the nested JWT within the response to return a plain JSON object.

---

## 4. Legal & Security Compliance

### 4.1 Ecosystem Alignment
The SDK strictly adheres to the **Ethiopian Digital Identification Proclamation 1284/2023** by facilitating the standard eSignet flow. It does **not** bypass user consent; it streamlines the technical redirect to the official consent portal.

### 4.2 Security Controls
-   **Data Minimization**: The SDK is stateless. It processes the identity token in memory and returns it to the caller. It does not write user data to disk or external databases.
-   **Dependency Safety**: We rely on `jose`, which is the industry standard for Javascript Object Signing and Encryption, minimizing the risk of "rolling our own crypto".

---

## 5. API Reference (Draft)

### `FaydaClient` Configuration
```javascript
const client = new FaydaClient({
    baseUrl: 'UAT', // or 'PROD'
    clientId: '...',
    privateKey: '...', // PEM string
    redirectUri: '...'
});
```

### Methods
1.  **`getAuthUrl(scope?)`**
    *   *Returns*: `{ url: string, codeVerifier: string, state: string }`
    *   *Purpose*: Generates the secure link to send the user to Fayda.
    
2.  **`getUser(code, codeVerifier)`**
    *   *Returns*: `Promise<UserInfoObject>`
    *   *Purpose*: Completes the entire handshake and returns the user's profile.

---

## 6. Conclusion
The `fayda-sdk` solves the high barrier to entry for Fayda integration. By encapsulating cryptographic complexity and OIDC flows into a simple 2-step API, it ensures that developers comply with security standards (PKCE, Private Key JWT) without needing to be security experts themselves.
