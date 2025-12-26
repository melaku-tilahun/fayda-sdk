import { FaydaClient } from 'fayda-sdk'; // In real usage: from 'fayda-sdk'

// This is a demo of how a developer would use the SDK
// Note: You must run 'npm run build' first!

const client = new FaydaClient({
    clientId: 'your-client-id',
    // Example Base64 Key
    privateKey: 'LS0tLS1CRUdJTiBQUklWQVRFIEtFWS0uLi4=', 
    environment: 'UAT',
    redirectUri: 'http://localhost:3000/callback'
});

console.log('SDK initialized!');

const { url, codeVerifier } = client.getAuthorizationUrl({
    scope: 'openid profile email'
});

console.log('\n--- 1. Generated Login URL ---');
console.log(url);

console.log('\n--- 2. Generated Secret Key (PKCE) ---');
console.log(codeVerifier);

console.log('\n--- 3. Next Steps ---');
console.log('Redirect user to the URL above.');
console.log('Store the PKCE Key securely in a cookie.');
console.log('When they return, verify them with client.getUser(code, verifier).');
