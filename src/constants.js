/**
 * Fayda (eSignet) Environment Configurations
 */

export const ENVIRONMENTS = {
    UAT: {
        issuer: 'https://esignet.ida.fayda.et',
        authorizationEndpoint: 'https://esignet...',
        tokenEndpoint: 'https://esignet....',
        userInfoEndpoint: 'https://esignet.ida...',
        // Common ACR values for Fayda
        acrValues: 'mosip....'
    },
    PROD: {
        issuer: 'https://id.gov.et', // Placeholder, developer needs to confirm prod issuer
        authorizationEndpoint: 'https://id.gov.et/..',
        tokenEndpoint: 'https://id.gov.et/...',
        userInfoEndpoint: 'https://id.gov.et/.....',
        acrValues: 'mosip........'
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
