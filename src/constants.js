/**
 * Fayda (eSignet) Environment Configurations
 */

export const ENVIRONMENTS = {
    UAT: {
        issuer: 'https://esignet.ida.fayda.et',
        authorizationEndpoint: 'https://esignet.ida.fayda.et/authorize',
        tokenEndpoint: 'https://esignet.ida.fayda.et/v1/esignet/oauth/v2/token',
        userInfoEndpoint: 'https://esignet.ida.fayda.et/v1/esignet/oidc/userinfo',
        // Common ACR values for Fayda-UAT
        acrValues: 'mosip:idp:acr:generated-code mosip:idp:acr:biometrics mosip:idp:acr:linked-wallet'
    },
    PROD: {
        issuer: 'https://auth.fayda.et', 
        authorizationEndpoint: 'https://auth.fayda.et/authorize',
        tokenEndpoint: 'https://auth.fayda.et/v1/esignet/oauth/v2/token',
        userInfoEndpoint: 'https://auth.fayda.et/v1/esignet/oidc/userinfo',
        // Common ACR values for Fayda-PROD
        acrValues: 'mosip:idp:acr:generated-code mosip:idp:acr:biometrics'
    }
};

export const DEFAULT_SCOPES = 'openid profile email phone';

// Essential claims to request from Fayda
export const ESSENTIAL_CLAIMS = {
    userinfo: {
        name: { essential: true },
        phone: { essential: true },
        email: { essential: true },
        picture: { essential: true },
        gender: { essential: true },
        birthdate: { essential: true },
        address: { essential: true }
    },
    id_token: {}
};
