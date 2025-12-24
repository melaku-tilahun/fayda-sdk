
import { FaydaClient } from './src/index.js';

console.log('Testing Fayda SDK Import...');

try {
    const client = new FaydaClient({
        clientId: 'test-client',
        privateKey: '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDPb/...\n-----END PRIVATE KEY-----', // Fake key
        environment: 'UAT',
        redirectUri: 'http://localhost:3000'
    });

    console.log('Client initialized successfully.');
    
    const auth = client.getAuthorizationUrl();
    console.log('Generated Auth URL:', auth.url);
    console.log('Generated Verifier:', auth.codeVerifier);
    
    if (auth.codeVerifier.length > 40) {
        console.log('PASS: Verifier length is correct.');
    } else {
        console.error('FAIL: Verifier too short.');
    }

} catch (e) {
    console.error('FAIL: SDK Error:', e.message);
}
