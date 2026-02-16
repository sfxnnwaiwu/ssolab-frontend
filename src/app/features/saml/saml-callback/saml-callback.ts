import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
    ErrorAuthResult,
    isErrorAuthResult,
    isSamlAuthResult,
    SamlAuthResult,
} from '../../../core/models/sso-test.model';
import { Auth } from '../../../core/services/auth';

interface UserAttribute {
    name: string;
    value: string | string[];
    description?: string;
}

interface SamlResponse {
    nameId: string;
    sessionIndex: string;
    attributes: Record<string, string | string[]>;
    issuer: string;
    notBefore: string;
    notOnOrAfter: string;
    rawAssertion: string;
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
    selector: 'app-saml-callback',
    imports: [CommonModule],
    templateUrl: './saml-callback.html',
    styleUrl: './saml-callback.css',
})
export class SamlCallback implements OnInit {
    private readonly authService = inject(Auth);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);

    protected readonly isLoading = signal(true);
    protected readonly hasError = signal(false);
    protected readonly errorMessage = signal('');
    protected readonly errorDetail = signal<ErrorDetail | null>(null);
    protected readonly showLogs = signal(false);
    protected readonly activeTab = signal<'decoded' | 'raw'>('decoded');
    protected readonly copySuccess = signal(false);

    protected samlResponse = signal<SamlResponse | null>(null);
    protected userAttributes = signal<UserAttribute[]>([]);
    protected requestLog = signal<RequestLog | null>(null);
    protected responseLog = signal<ResponseLog | null>(null);

    // Expose JSON for template use
    protected readonly JSON = JSON;

    ngOnInit(): void {
        const urlParams = new URLSearchParams(window.location.search);
        const resultId = urlParams.get('resultId');
        const success = urlParams.get('success');

        if (resultId) {
            // Fetch result from backend using resultId
            this.fetchAuthResult(resultId);
        } else if (success) {
            // Try session-based retrieval
            this.fetchAuthResultFromSession();
        } else {
            // Fallback to mock
            // this.processSamlResponse();
        }

        // Fetch authentication result from backend session
        // this.fetchAuthResult();

        // const urlParams = new URLSearchParams(window.location.search);
        // const samlResponse = urlParams.get('SAMLResponse');
        // const relayState = urlParams.get('RelayState');
        // if (!samlResponse) {
        //     this.hasError.set(true);
        //     this.errorMessage.set('No SAML response received from Identity Provider');
        //     this.isLoading.set(false);
        //     return;
        // }
        // Send to backend for validation
        // this.validateSamlResponse(samlResponse, relayState);
    }

    // private validateSamlResponse(samlResponse: string, relayState: string | null): void {
    //     this.authService.validateSamlResponse(samlResponse, relayState).subscribe({
    //         next: (result) => {
    //             if (isSamlAuthResult(result)) {
    //                 this.handleSuccessResult(result);
    //             } else if (isErrorAuthResult(result)) {
    //                 this.handleErrorResult(result);
    //             } else {
    //                 this.hasError.set(true);
    //                 this.errorMessage.set('Invalid authentication result type');
    //             }
    //             this.isLoading.set(false);
    //         },
    //         error: (error) => {
    //             this.hasError.set(true);
    //             this.errorMessage.set(error?.error?.message || 'Failed to validate SAML response');
    //             this.isLoading.set(false);
    //         },
    //     });
    // }

    private fetchAuthResult(resultId: string): void {
        this.authService.getSessionAuthResult(resultId).subscribe({
            next: (result) => {
                if (isSamlAuthResult(result)) {
                    this.handleSuccessResult(result);
                } else if (isErrorAuthResult(result)) {
                    this.handleErrorResult(result);
                } else {
                    // Wrong protocol - might be OIDC result instead
                    this.hasError.set(true);
                    this.errorMessage.set(
                        'Invalid authentication result type. Expected SAML result.'
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

    private fetchAuthResultFromSession(): void {
        this.authService.fetchAuthResultFromSession().subscribe({
            next: (response: any) => {
                if (response.success && response.data) {
                    this.handleAuthResult(response.data);
                }
                this.isLoading.set(false);
            },
            error: (error) => {
                this.hasError.set(true);
                this.errorMessage.set(error?.error?.message || 'No authentication result found');
                this.isLoading.set(false);
            },
        });
    }

    private handleAuthResult(result: any): void {
        if (result.success) {
            // Process successful SAML response
            this.samlResponse.set({
                nameId: result.samlResponse.decoded.subject,
                sessionIndex: result.samlResponse.decoded.sessionIndex,
                attributes: result.userAttributes,
                issuer: result.samlResponse.decoded.issuer,
                notBefore: result.samlResponse.decoded.conditions.notBefore,
                notOnOrAfter: result.samlResponse.decoded.conditions.notOnOrAfter,
                rawAssertion: result.samlResponse.raw,
            });

            this.processAttributes(result.userAttributes);
        } else {
            // Handle error
            this.hasError.set(true);
            this.errorMessage.set(result.error?.message || 'Authentication failed');
        }
    }

    private handleSuccessResult(result: SamlAuthResult): void {
        // Map backend SAML result to component interface
        const samlResponse: SamlResponse = {
            nameId: result.samlResponse.decoded.subject,
            sessionIndex: result.samlResponse.decoded.sessionIndex,
            issuer: result.samlResponse.decoded.issuer,
            notBefore: result.samlResponse.decoded.conditions.notBefore,
            notOnOrAfter: result.samlResponse.decoded.conditions.notOnOrAfter,
            attributes: result.userAttributes,
            rawAssertion: result.samlResponse.raw,
        };

        this.samlResponse.set(samlResponse);
        this.processAttributes(result.userAttributes);

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

    private processAttributes(attrs: Record<string, string | string[]>): void {
        const attributes: UserAttribute[] = [];

        for (const [key, value] of Object.entries(attrs)) {
            attributes.push({
                name: key,
                value: value,
                description: this.getAttributeDescription(key),
            });
        }

        this.userAttributes.set(attributes);
    }

    private getAttributeDescription(attrName: string): string {
        const descriptions: Record<string, string> = {
            email: 'User email address',
            firstName: 'First name',
            lastName: 'Last name',
            displayName: 'Display name',
            department: 'Department or organizational unit',
            groups: 'Group memberships',
            employeeId: 'Employee identifier',
            mobile: 'Mobile phone number',
            uid: 'User identifier',
            cn: 'Common name',
            sn: 'Surname',
            givenName: 'Given name',
            role: 'User role',
            title: 'Job title',
        };
        return descriptions[attrName] || 'Custom attribute';
    }

    setActiveTab(tab: 'decoded' | 'raw'): void {
        this.activeTab.set(tab);
    }

    async copyToClipboard(): Promise<void> {
        const response = this.samlResponse();
        if (!response) return;

        try {
            await navigator.clipboard.writeText(response.rawAssertion);
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

    formatValue(value: string | string[]): string {
        if (Array.isArray(value)) {
            return value.join(', ');
        }
        return value;
    }

    isArrayValue(value: string | string[]): boolean {
        return Array.isArray(value);
    }

    toggleLogs(): void {
        this.showLogs.set(!this.showLogs());
    }

    stringifyJson(obj: any): string {
        return JSON.stringify(obj, null, 2);
    }
}
