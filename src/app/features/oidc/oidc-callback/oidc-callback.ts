import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';

interface TokenClaim {
    name: string;
    value: string | number | boolean | string[];
    description?: string;
}

interface OidcTokens {
    idToken: string;
    accessToken: string;
    refreshToken?: string;
    decodedIdToken: Record<string, any>;
    decodedAccessToken?: Record<string, any>;
    expiresIn: number;
    tokenType: string;
}

interface ErrorDetail {
    code: string;
    title: string;
    message: string;
    technicalDetails?: string;
    troubleshootingSteps: string[];
    relatedDocs?: string[];
}

interface RequestLog {
    timestamp: string;
    method: string;
    url: string;
    headers: Record<string, string>;
    body?: string;
}

interface ResponseLog {
    timestamp: string;
    status: number;
    statusText: string;
    headers: Record<string, string>;
    body?: string;
}

@Component({
    selector: 'app-oidc-callback',
    imports: [CommonModule],
    templateUrl: './oidc-callback.html',
    styleUrl: './oidc-callback.css',
})
export class OidcCallback implements OnInit {
    protected readonly isLoading = signal(true);
    protected readonly hasError = signal(false);
    protected readonly errorMessage = signal('');
    protected readonly errorDetail = signal<ErrorDetail | null>(null);
    protected readonly showLogs = signal(false);
    protected readonly activeTab = signal<'decoded' | 'raw'>('decoded');
    protected readonly activeTokenTab = signal<'id' | 'access'>('id');
    protected readonly copySuccess = signal(false);

    protected tokens = signal<OidcTokens | null>(null);
    protected claims = signal<TokenClaim[]>([]);
    protected requestLog = signal<RequestLog | null>(null);
    protected responseLog = signal<ResponseLog | null>(null);

    // Expose JSON for template use
    protected readonly JSON = JSON;

    constructor(private router: Router) {}

    ngOnInit(): void {
        // Check URL params for error simulation
        const urlParams = new URLSearchParams(window.location.search);
        const simulateError = urlParams.get('error');

        setTimeout(() => {
            if (simulateError) {
                this.simulateError(simulateError);
            } else {
                this.processOidcTokens();
            }
        }, 1000);
    }

    private processOidcTokens(): void {
        try {
            const now = Math.floor(Date.now() / 1000);

            // Mock decoded ID token
            const decodedIdToken = {
                iss: 'https://idp.example.com',
                sub: '248289761001',
                aud: 'your-client-id',
                exp: now + 3600,
                iat: now,
                auth_time: now,
                nonce: 'n-0S6_WzA2Mj',
                email: 'jane.smith@example.com',
                email_verified: true,
                name: 'Jane Smith',
                given_name: 'Jane',
                family_name: 'Smith',
                preferred_username: 'jane.smith',
                picture: 'https://example.com/avatar.jpg',
                locale: 'en-US',
                roles: ['user', 'admin'],
            };

            // Mock tokens
            const mockTokens: OidcTokens = {
                idToken:
                    'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjEyMzQ1In0.eyJpc3MiOiJodHRwczovL2lkcC5leGFtcGxlLmNvbSIsInN1YiI6IjI0ODI4OTc2MTAwMSIsImF1ZCI6InlvdXItY2xpZW50LWlkIiwiZXhwIjoxNzA2NzMwMDAwLCJpYXQiOjE3MDY3MjY0MDAsImF1dGhfdGltZSI6MTcwNjcyNjQwMCwibm9uY2UiOiJuLTBTNl9XekEyTWoiLCJlbWFpbCI6ImphbmUuc21pdGhAZXhhbXBsZS5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwibmFtZSI6IkphbmUgU21pdGgiLCJnaXZlbl9uYW1lIjoiSmFuZSIsImZhbWlseV9uYW1lIjoiU21pdGgiLCJwcmVmZXJyZWRfdXNlcm5hbWUiOiJqYW5lLnNtaXRoIiwicGljdHVyZSI6Imh0dHBzOi8vZXhhbXBsZS5jb20vYXZhdGFyLmpwZyIsImxvY2FsZSI6ImVuLVVTIiwicm9sZXMiOlsidXNlciIsImFkbWluIl19.dGhpcyBpcyBhIG1vY2sgc2lnbmF0dXJlIGZvciB0ZXN0aW5nIHB1cnBvc2VzIG9ubHk',
                accessToken:
                    'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL2lkcC5leGFtcGxlLmNvbSIsInN1YiI6IjI0ODI4OTc2MTAwMSIsImF1ZCI6ImFwaS5leGFtcGxlLmNvbSIsImV4cCI6MTcwNjczMDAwMCwiaWF0IjoxNzA2NzI2NDAwLCJzY29wZSI6Im9wZW5pZCBwcm9maWxlIGVtYWlsIn0.YW5vdGhlciBtb2NrIHNpZ25hdHVyZSBmb3IgYWNjZXNzIHRva2VuIHRlc3Rpbmc',
                refreshToken: 'refresh_token_mock_value_1234567890',
                decodedIdToken,
                expiresIn: 3600,
                tokenType: 'Bearer',
            };

            this.tokens.set(mockTokens);
            this.processClaims(decodedIdToken);
            this.isLoading.set(false);
        } catch (error) {
            this.hasError.set(true);
            this.errorMessage.set('Failed to process OIDC tokens');
            this.isLoading.set(false);
        }
    }

    private processClaims(claims: Record<string, any>): void {
        const claimList: TokenClaim[] = [];

        for (const [key, value] of Object.entries(claims)) {
            claimList.push({
                name: key,
                value: value,
                description: this.getClaimDescription(key),
            });
        }

        this.claims.set(claimList);
    }

    private getClaimDescription(claimName: string): string {
        const descriptions: Record<string, string> = {
            iss: 'Issuer - who created the token',
            sub: 'Subject - unique user identifier',
            aud: 'Audience - intended recipient',
            exp: 'Expiration time (Unix timestamp)',
            iat: 'Issued at time (Unix timestamp)',
            auth_time: 'Authentication time',
            nonce: 'Nonce value for replay protection',
            email: 'User email address',
            email_verified: 'Email verification status',
            name: 'Full name',
            given_name: 'First name',
            family_name: 'Last name',
            preferred_username: 'Preferred username',
            picture: 'Profile picture URL',
            locale: 'User locale/language',
            roles: 'User roles or permissions',
        };
        return descriptions[claimName] || 'Custom claim';
    }

    setActiveTab(tab: 'decoded' | 'raw'): void {
        this.activeTab.set(tab);
    }

    setActiveTokenTab(tab: 'id' | 'access'): void {
        this.activeTokenTab.set(tab);
    }

    async copyToClipboard(tokenType: 'id' | 'access' | 'refresh'): Promise<void> {
        const tokens = this.tokens();
        if (!tokens) return;

        let tokenToCopy = '';
        switch (tokenType) {
            case 'id':
                tokenToCopy = tokens.idToken;
                break;
            case 'access':
                tokenToCopy = tokens.accessToken;
                break;
            case 'refresh':
                tokenToCopy = tokens.refreshToken || '';
                break;
        }

        try {
            await navigator.clipboard.writeText(tokenToCopy);
            this.copySuccess.set(true);
            setTimeout(() => this.copySuccess.set(false), 2000);
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
        }
    }

    testAnotherProtocol(): void {
        this.router.navigate(['/']);
    }

    logout(): void {
        // Clear session storage
        sessionStorage.removeItem('oidc-config');
        this.router.navigate(['/']);
    }

    formatClaimValue(value: any): string {
        if (typeof value === 'boolean') {
            return value ? 'true' : 'false';
        }
        if (Array.isArray(value)) {
            return value.join(', ');
        }
        if (typeof value === 'number') {
            // Check if it's a Unix timestamp
            if (value > 1000000000 && value < 10000000000) {
                return `${value} (${new Date(value * 1000).toLocaleString()})`;
            }
            return value.toString();
        }
        return String(value);
    }

    isTimestamp(key: string): boolean {
        return ['exp', 'iat', 'auth_time', 'nbf'].includes(key);
    }

    getFormattedJson(obj: any): string {
        return JSON.stringify(obj, null, 2);
    }

    toggleLogs(): void {
        this.showLogs.set(!this.showLogs());
    }

    stringifyJson(obj: any): string {
        return JSON.stringify(obj, null, 2);
    }

    private simulateError(errorType: string): void {
        this.isLoading.set(false);
        this.hasError.set(true);

        // Create mock request/response logs
        this.requestLog.set({
            timestamp: new Date().toISOString(),
            method: 'POST',
            url: 'https://idp.example.com/oauth/token',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Authorization: 'Basic Y2xpZW50OnNlY3JldA==',
            },
            body: 'grant_type=authorization_code&code=AUTH_CODE_HERE&redirect_uri=https://sp.example.com/callback&code_verifier=PKCE_VERIFIER',
        });

        this.responseLog.set({
            timestamp: new Date().toISOString(),
            status: 400,
            statusText: 'Bad Request',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(
                { error: errorType, error_description: 'Token exchange failed' },
                null,
                2
            ),
        });

        let errorDetail: ErrorDetail;

        switch (errorType) {
            case 'invalid_client':
                errorDetail = {
                    code: 'OIDC_INVALID_CLIENT',
                    title: 'Invalid Client Credentials',
                    message: 'The client ID or client secret is incorrect.',
                    technicalDetails:
                        'Authentication failed: Client credentials do not match any registered application.',
                    troubleshootingSteps: [
                        'Verify the Client ID matches exactly what was registered with the IdP',
                        'Check that the Client Secret is correct (it may have been rotated)',
                        'Ensure there are no extra spaces or hidden characters in credentials',
                        'Confirm the client is registered and active in the IdP',
                        'Check if the client credentials are environment-specific (dev/staging/prod)',
                    ],
                    relatedDocs: ['OIDC Client Registration', 'Client Credential Management'],
                };
                break;

            case 'invalid_grant':
                errorDetail = {
                    code: 'OIDC_INVALID_GRANT',
                    title: 'Invalid Authorization Grant',
                    message:
                        'The authorization code is invalid, expired, or has already been used.',
                    technicalDetails:
                        'The authorization code cannot be exchanged for tokens. It may have expired or already been redeemed.',
                    troubleshootingSteps: [
                        'Authorization codes are single-use only - check if it was already exchanged',
                        'Verify the code has not expired (typically valid for 60-120 seconds)',
                        'Ensure the redirect_uri matches exactly what was used in the authorization request',
                        'Check for clock synchronization issues between client and server',
                        'Verify the code was not intercepted or modified in transit',
                    ],
                    relatedDocs: ['Authorization Code Flow', 'OIDC Security Best Practices'],
                };
                break;

            case 'invalid_token':
                errorDetail = {
                    code: 'OIDC_INVALID_TOKEN',
                    title: 'Invalid or Malformed Token',
                    message: 'The ID token or access token is invalid or cannot be verified.',
                    technicalDetails:
                        'Token signature verification failed or token format is invalid.',
                    troubleshootingSteps: [
                        "Verify the token signature using the IdP's public keys (JWKS endpoint)",
                        'Check that the token has not been modified in transit',
                        'Ensure the token has not expired (check "exp" claim)',
                        'Verify the "iss" (issuer) claim matches your IdP',
                        'Confirm the "aud" (audience) claim matches your client ID',
                    ],
                    relatedDocs: ['JWT Validation', 'JWKS Endpoint Configuration'],
                };
                break;

            case 'unauthorized_client':
                errorDetail = {
                    code: 'OIDC_UNAUTHORIZED_CLIENT',
                    title: 'Client Not Authorized',
                    message: 'The client is not authorized to use this grant type or scope.',
                    technicalDetails:
                        'The requested grant type or scopes are not allowed for this client configuration.',
                    troubleshootingSteps: [
                        'Check the allowed grant types in your IdP client configuration',
                        'Verify the Authorization Code flow is enabled for your client',
                        'Review the requested scopes - ensure they are granted to your client',
                        'Check if the client requires consent for the requested scopes',
                        'Verify the redirect URI is registered for this client',
                    ],
                    relatedDocs: ['OIDC Client Configuration', 'OAuth 2.0 Grant Types'],
                };
                break;

            case 'access_denied':
                errorDetail = {
                    code: 'OIDC_ACCESS_DENIED',
                    title: 'Access Denied',
                    message: 'The user or authorization server denied the authentication request.',
                    technicalDetails:
                        'User denied consent or authorization server rejected the request based on policy.',
                    troubleshootingSteps: [
                        'Check if the user cancelled the authentication flow',
                        'Verify the user has permission to access the application',
                        'Review consent screen settings - ensure required scopes are explained',
                        'Check for conditional access policies that may block the request',
                        'Verify the user account is active and not locked',
                    ],
                    relatedDocs: ['User Consent Configuration', 'Conditional Access Policies'],
                };
                break;

            case 'invalid_scope':
                errorDetail = {
                    code: 'OIDC_INVALID_SCOPE',
                    title: 'Invalid Scope Requested',
                    message: 'One or more requested scopes are invalid or not available.',
                    technicalDetails:
                        'The authorization server does not support the requested scopes or they are not configured for this client.',
                    troubleshootingSteps: [
                        'Review the scopes requested in your configuration',
                        'Ensure "openid" scope is included (required for OIDC)',
                        'Check that custom scopes are defined in the IdP',
                        'Verify scope names match exactly (case-sensitive)',
                        'Confirm the client has permission to request these scopes',
                    ],
                    relatedDocs: ['OIDC Scopes', 'Custom Scope Configuration'],
                };
                break;

            default:
                errorDetail = {
                    code: 'OIDC_UNKNOWN_ERROR',
                    title: 'OIDC Authentication Failed',
                    message: 'An unexpected error occurred during OIDC authentication.',
                    technicalDetails: 'Error details not available',
                    troubleshootingSteps: [
                        'Check the browser console for detailed error messages',
                        'Review backend logs for token exchange errors',
                        'Verify the OIDC discovery endpoint is accessible',
                        'Check network connectivity to the IdP',
                        'Ensure the IdP service is operational',
                    ],
                    relatedDocs: ['OIDC Troubleshooting Guide', 'Common OIDC Errors'],
                };
        }

        this.errorDetail.set(errorDetail);
        this.errorMessage.set(errorDetail.message);
    }
}
