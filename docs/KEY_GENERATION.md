# Key Generation Guide for NID (Fayda) Integration

This guide explains how to generate the RSA keys required for authentication with Fayda eSignet.

## 1. What are these keys?
- **Private Key**: A secret file (Leaf Key) that stays on your server. `fayda-sdk` uses it to sign your requests.
- **Public Key**: The matching public file that you MUST share with the National ID Program so they can verify your signature.

## 2. Generating Keys (OpenSSL Method)

You can generate these keys using the `openssl` command line tool (available on Linux, Mac, and Windows Git Bash).

### Step 1: Generate the Private Key
This creates a 2048-bit RSA private key.
```bash
openssl genrsa -out private_key.pem 2048
```

### Step 2: Extract the Public Key
This extracts the public key from the private key file.
```bash
openssl rsa -in private_key.pem -pubout -out public_key.pem
```

## 3. Preparing the Key for `.env`

The standard `private_key.pem` format spans multiple lines, which can be tricky to paste into a `.env` file. We recommend Base64 encoding it.

### Method A: Using the `encode_key.js` Script (Recommended)
We have provided a script in the parent directory to handle this automatically.

1.  Place your `private_key.pem` (or your existing key file, typically named like `g2g_leaf.key`) in the project root.
2.  Run the encoding script:
    ```bash
    node encode_key.js private_key.pem
    ```
3.  The script will output a long string. Copy that string.
4.  Paste it into your `.env` file:
    ```env
    FAYDA_PRIVATE_KEY="<PASTE_YOUR_BASE64_STRING_HERE>"
    ```

### Method B: Manual Manual encoding (Linux/Mac)
```bash
base64 -w 0 private_key.pem
```

## 4. How to Use in `fayda-sdk`

Once you have the Base64 string in your environment variable, pass it directly to the SDK:

```javascript
const fayda = new FaydaClient({
    clientId: "YOUR_CLIENT_ID",
    privateKey: process.env.FAYDA_PRIVATE_KEY, // The SDK automatically detects Base64
    environment: "UAT"
});
```
