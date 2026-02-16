import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
    ErrorAuthResult,
    isErrorAuthResult,
    isOidcAuthResult,
    OidcAuthResult,
} from '../../../core/models/sso-test.model';
import { Auth } from '../../../core/services/auth';

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
    private readonly authService = inject(Auth);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);

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

    ngOnInit(): void {
        // Fetch authentication result from backend session
        // this.fetchAuthResult();

        const urlParams = new URLSearchParams(window.location.search);
        const resultId = urlParams.get('resultId');
        const success = urlParams.get('success');

        if (resultId) {
            // Fetch result from backend using resultId
            this.fetchAuthResult(resultId);
        } else if (success) {
            // Try session-based retrieval
            // this.fetchAuthResultFromSession();
        } else {
            // Fallback to mock
            // this.processSamlResponse();
        }
    }

    private fetchAuthResult(resultId: string): void {
        this.authService.getSessionAuthResult(resultId).subscribe({
            next: (result) => {
                if (isOidcAuthResult(result)) {
                    this.handleSuccessResult(result);
                } else if (isErrorAuthResult(result)) {
                    this.handleErrorResult(result);
                } else {
                    // Wrong protocol - might be SAML result instead
                    this.hasError.set(true);
                    this.errorMessage.set(
                        'Invalid authentication result type. Expected OIDC result.'
                    );
                }
                this.isLoading.set(false);
            },
            error: (error) => {
                this.hasError.set(true);
                this.errorMessage.set(
                    error?.error?.message || 'Failed to retrieve authentication result from session'
                );
                this.isLoading.set(false);
            },
        });
    }

    private handleSuccessResult(result: OidcAuthResult): void {
        // Map backend OIDC result to component interface
        const oidcTokens: OidcTokens = {
            idToken: result.tokens.idToken.raw,
            accessToken: result.tokens.accessToken.raw,
            refreshToken: result.tokens.refreshToken?.raw,
            decodedIdToken: result.tokens.idToken.decoded.payload,
            decodedAccessToken: result.tokens.accessToken.decoded,
            expiresIn: result.tokens.expiresIn,
            tokenType: result.tokens.tokenType,
        };

        this.tokens.set(oidcTokens);
        this.processClaims(result.userClaims);

        // Map request/response logs
        this.requestLog.set({
            timestamp: result.requestLog.timestamp,
            method: result.requestLog.method,
            url: result.requestLog.url,
            headers: result.requestLog.headers,
            body: result.requestLog.body
                ? JSON.stringify(result.requestLog.body, null, 2)
                : undefined,
        });

        this.responseLog.set({
            timestamp: result.responseLog.timestamp,
            status: result.responseLog.status,
            statusText: result.responseLog.statusText,
            headers: result.responseLog.headers,
            body: result.responseLog.body
                ? JSON.stringify(result.responseLog.body, null, 2)
                : undefined,
        });
    }

    private handleErrorResult(result: ErrorAuthResult): void {
        this.hasError.set(true);

        const errorDetail: ErrorDetail = {
            code: result.error.type.toUpperCase(),
            title: result.error.title,
            message: result.error.description,
            technicalDetails: result.error.technicalDetails,
            troubleshootingSteps: result.error.troubleshootingSteps,
            relatedDocs: result.error.relatedDocs?.map((doc) => doc.title) || [],
        };

        this.errorDetail.set(errorDetail);
        this.errorMessage.set(result.error.description);

        // Map request/response logs
        this.requestLog.set({
            timestamp: result.requestLog.timestamp,
            method: result.requestLog.method,
            url: result.requestLog.url,
            headers: result.requestLog.headers,
            body: result.requestLog.body
                ? JSON.stringify(result.requestLog.body, null, 2)
                : undefined,
        });

        this.responseLog.set({
            timestamp: result.responseLog.timestamp,
            status: result.responseLog.status,
            statusText: result.responseLog.statusText,
            headers: result.responseLog.headers,
            body: result.responseLog.body
                ? JSON.stringify(result.responseLog.body, null, 2)
                : undefined,
        });
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
        // Clear session and navigate to home
        this.clearSessionAndNavigate('/');
    }

    logout(): void {
        // Clear session and navigate to home
        this.clearSessionAndNavigate('/');
    }

    private clearSessionAndNavigate(path: string): void {
        this.authService.clearSession().subscribe({
            next: () => {
                this.router.navigate([path]);
            },
            error: (err) => {
                console.error('Failed to clear session:', err);
                // Navigate anyway
                this.router.navigate([path]);
            },
        });
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
}
