export interface SamlConfiguration {
    id: string;
    userId: string;
    name: string;
    entityId: string;
    ssoUrl: string;
    certificate: string;
    protocol: string;
    lastTestedAt: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface OidcConfiguration {
    id: string;
    userId: string;
    name: string;
    issuer: string;
    clientId: string;
    clientSecret: string;
    scopes: string;
    protocol: string;
    lastTestedAt: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface TestResult {
    id: string;
    configurationId: string;
    configType: 'SAML' | 'OIDC';
    userId: string;
    success: boolean;
    error: any;
    claims: any;
    tokens: any;
    testedAt: string;
}

export interface DashboardConfigurations {
    saml: SamlConfiguration[];
    oidc: OidcConfiguration[];
}
