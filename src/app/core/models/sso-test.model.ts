/**
 * SSO Test Result Models
 * Matches backend session auth result interfaces
 */

export interface RequestLog {
    method: string;
    url: string;
    headers: Record<string, string>;
    body?: any;
    timestamp: string;
    duration?: number;
}

export interface ResponseLog {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    body?: any;
    timestamp: string;
}

export interface ErrorDetail {
    type: string;
    title: string;
    description: string;
    technicalDetails: string;
    troubleshootingSteps: string[];
    relatedDocs?: Array<{
        title: string;
        url: string;
    }>;
}

/**
 * SAML Authentication Result
 */
export interface SamlAuthResult {
    success: true;
    protocol: 'saml';
    timestamp: string;
    samlResponse: {
        decoded: {
            issuer: string;
            subject: string;
            sessionIndex: string;
            conditions: {
                notBefore: string;
                notOnOrAfter: string;
                audience: string;
            };
        };
        raw: string;
    };
    userAttributes: Record<string, string | string[]>;
    requestLog: RequestLog;
    responseLog: ResponseLog;
}

/**
 * OIDC Authentication Result
 */
export interface OidcAuthResult {
    success: true;
    protocol?: 'oidc';
    timestamp: string;
    tokens: {
        idToken: {
            raw: string;
            decoded: {
                header: Record<string, any>;
                payload: Record<string, any>;
                signature: string;
            };
        };
        accessToken: {
            raw: string;
            decoded?: Record<string, any>;
        };
        refreshToken?: {
            raw: string;
            decoded?: Record<string, any>;
        };
        expiresIn: number;
        tokenType: string;
    };
    userClaims: Record<string, any>;
    requestLog: RequestLog;
    responseLog: ResponseLog;
}

/**
 * Error Authentication Result (both SAML and OIDC)
 */
export interface ErrorAuthResult {
    success: false;
    protocol?: 'saml' | 'oidc';
    error: ErrorDetail;
    requestLog: RequestLog;
    responseLog: ResponseLog;
}

/**
 * Union type for all possible session auth results
 */
export type SessionAuthResult = SamlAuthResult | OidcAuthResult | ErrorAuthResult;

/**
 * Type guards
 */
export function isSamlAuthResult(result: SessionAuthResult): result is SamlAuthResult {
    return result.success === true && 'protocol' in result && result.protocol === 'saml';
}

export function isOidcAuthResult(result: SessionAuthResult): result is OidcAuthResult {
    return result.success === true && 'tokens' in result;
}

export function isErrorAuthResult(result: SessionAuthResult): result is ErrorAuthResult {
    return result.success === false;
}
