import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';

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

    constructor(private router: Router) {}

    ngOnInit(): void {
        // Check URL params for error simulation
        const urlParams = new URLSearchParams(window.location.search);
        const simulateError = urlParams.get('error');

        setTimeout(() => {
            if (simulateError) {
                this.simulateError(simulateError);
            } else {
                this.processSamlResponse();
            }
        }, 1000);
    }

    private processSamlResponse(): void {
        try {
            // Mock SAML response - in real app, this comes from backend API
            const mockResponse: SamlResponse = {
                nameId: 'john.doe@example.com',
                sessionIndex: '_8e8dc5f69a98ac3c9c17b7c3f8a5e8d1',
                issuer: 'https://idp.example.com/saml',
                notBefore: new Date(Date.now() - 60000).toISOString(),
                notOnOrAfter: new Date(Date.now() + 3600000).toISOString(),
                attributes: {
                    email: 'john.doe@example.com',
                    firstName: 'John',
                    lastName: 'Doe',
                    displayName: 'John Doe',
                    department: 'Engineering',
                    groups: ['Developers', 'Administrators', 'SAML-Users'],
                    employeeId: 'EMP-12345',
                    mobile: '+1-555-0123',
                },
                rawAssertion: `<?xml version="1.0" encoding="UTF-8"?>
<saml:Assertion xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"
                ID="_8e8dc5f69a98ac3c9c17b7c3f8a5e8d1"
                IssueInstant="${new Date().toISOString()}"
                Version="2.0">
    <saml:Issuer>https://idp.example.com/saml</saml:Issuer>
    <saml:Subject>
        <saml:NameID Format="urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress">
            john.doe@example.com
        </saml:NameID>
        <saml:SubjectConfirmation Method="urn:oasis:names:tc:SAML:2.0:cm:bearer">
            <saml:SubjectConfirmationData
                NotOnOrAfter="${new Date(Date.now() + 3600000).toISOString()}"
                Recipient="https://sp.example.com/saml/acs"/>
        </saml:SubjectConfirmation>
    </saml:Subject>
    <saml:Conditions
        NotBefore="${new Date(Date.now() - 60000).toISOString()}"
        NotOnOrAfter="${new Date(Date.now() + 3600000).toISOString()}">
        <saml:AudienceRestriction>
            <saml:Audience>https://sp.example.com/saml/metadata</saml:Audience>
        </saml:AudienceRestriction>
    </saml:Conditions>
    <saml:AttributeStatement>
        <saml:Attribute Name="email">
            <saml:AttributeValue>john.doe@example.com</saml:AttributeValue>
        </saml:Attribute>
        <saml:Attribute Name="firstName">
            <saml:AttributeValue>John</saml:AttributeValue>
        </saml:Attribute>
        <saml:Attribute Name="lastName">
            <saml:AttributeValue>Doe</saml:AttributeValue>
        </saml:Attribute>
    </saml:AttributeStatement>
</saml:Assertion>`,
            };

            this.samlResponse.set(mockResponse);
            this.processAttributes(mockResponse.attributes);
            this.isLoading.set(false);
        } catch (error) {
            this.hasError.set(true);
            this.errorMessage.set('Failed to process SAML response');
            this.isLoading.set(false);
        }
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
        this.router.navigate(['/']);
    }

    logout(): void {
        // Clear session storage
        sessionStorage.removeItem('saml-config');
        this.router.navigate(['/']);
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

    private simulateError(errorType: string): void {
        this.isLoading.set(false);
        this.hasError.set(true);

        // Create mock request/response logs
        this.requestLog.set({
            timestamp: new Date().toISOString(),
            method: 'POST',
            url: 'https://sp.example.com/saml/acs',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'Mozilla/5.0',
            },
            body: 'SAMLResponse=PHNhbWw6QXNzZXJ0aW9uPi4uLjwvc2FtbDpBc3NlcnRpb24%2B&RelayState=...',
        });

        this.responseLog.set({
            timestamp: new Date().toISOString(),
            status: 401,
            statusText: 'Unauthorized',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(
                { error: errorType, details: 'SAML assertion validation failed' },
                null,
                2
            ),
        });

        let errorDetail: ErrorDetail;

        switch (errorType) {
            case 'invalid_signature':
                errorDetail = {
                    code: 'SAML_INVALID_SIGNATURE',
                    title: 'Invalid SAML Assertion Signature',
                    message:
                        'The SAML assertion signature could not be verified against the IdP certificate.',
                    technicalDetails:
                        'Signature validation failed: The digest value in the signature does not match the calculated digest of the assertion.',
                    troubleshootingSteps: [
                        'Verify that the correct IdP certificate is configured in your Service Provider',
                        'Ensure the certificate has not expired',
                        'Check that the certificate format is correct (PEM format with proper headers)',
                        'Verify that the IdP is using the correct signing algorithm (SHA-256 is recommended)',
                        'Confirm there are no whitespace or encoding issues in the certificate',
                    ],
                    relatedDocs: [
                        'SAML 2.0 Signature Specification',
                        'IdP Certificate Configuration Guide',
                    ],
                };
                break;

            case 'expired_assertion':
                errorDetail = {
                    code: 'SAML_ASSERTION_EXPIRED',
                    title: 'SAML Assertion Expired',
                    message: 'The SAML assertion has expired and is no longer valid.',
                    technicalDetails: `Assertion NotOnOrAfter time has passed. Current time: ${new Date().toISOString()}`,
                    troubleshootingSteps: [
                        'Check the clock synchronization between IdP and SP servers (use NTP)',
                        'Verify the assertion validity period configured in your IdP',
                        'Increase the assertion lifetime if the network latency is high',
                        'Check for timezone misconfigurations',
                        'Ensure there is no significant clock skew (should be < 5 minutes)',
                    ],
                    relatedDocs: [
                        'SAML Time Synchronization Best Practices',
                        'Clock Skew Configuration',
                    ],
                };
                break;

            case 'invalid_audience':
                errorDetail = {
                    code: 'SAML_INVALID_AUDIENCE',
                    title: 'Invalid Audience Restriction',
                    message:
                        'The SAML assertion audience does not match the expected SP entity ID.',
                    technicalDetails:
                        'Expected audience: https://sp.example.com/metadata, Received: https://wrong-sp.example.com/metadata',
                    troubleshootingSteps: [
                        'Verify the Entity ID configured in your Service Provider matches the IdP configuration',
                        'Check the SP metadata file for the correct entityID attribute',
                        'Update the IdP configuration to use the correct SP entity ID',
                        'Ensure the audience restriction in the IdP assertion configuration matches your SP',
                        'Re-upload SP metadata to the IdP if recently changed',
                    ],
                    relatedDocs: ['SAML Entity ID Configuration', 'SP Metadata Format'],
                };
                break;

            case 'missing_attributes':
                errorDetail = {
                    code: 'SAML_MISSING_REQUIRED_ATTRIBUTES',
                    title: 'Required Attributes Missing',
                    message: 'The SAML assertion is missing required user attributes.',
                    technicalDetails: 'Required attributes not found: [email, firstName, lastName]',
                    troubleshootingSteps: [
                        'Check the attribute mapping configuration in your IdP',
                        'Verify that the user profile in the IdP contains the required attributes',
                        'Review the IdP attribute release policy for your SP',
                        'Confirm the attribute names match exactly (case-sensitive)',
                        'Check the SAML assertion to see which attributes are being sent',
                    ],
                    relatedDocs: [
                        'SAML Attribute Mapping Guide',
                        'IdP Attribute Release Configuration',
                    ],
                };
                break;

            case 'certificate_mismatch':
                errorDetail = {
                    code: 'SAML_CERTIFICATE_MISMATCH',
                    title: 'Certificate Mismatch',
                    message:
                        'The signing certificate in the assertion does not match the configured IdP certificate.',
                    technicalDetails:
                        'Certificate fingerprint mismatch. Expected: A1:B2:C3..., Received: D4:E5:F6...',
                    troubleshootingSteps: [
                        'Verify you have the latest IdP certificate installed',
                        'Check if the IdP has recently rotated their signing certificates',
                        'Download and install the updated certificate from the IdP',
                        'Confirm the certificate chain is complete',
                        "Check for certificate format issues (ensure it's X.509 PEM format)",
                    ],
                    relatedDocs: [
                        'Certificate Management Best Practices',
                        'IdP Certificate Rotation',
                    ],
                };
                break;

            default:
                errorDetail = {
                    code: 'SAML_UNKNOWN_ERROR',
                    title: 'SAML Authentication Failed',
                    message: 'An unexpected error occurred during SAML authentication.',
                    technicalDetails: 'Error details not available',
                    troubleshootingSteps: [
                        'Check the browser console for JavaScript errors',
                        'Review the backend logs for detailed error information',
                        'Verify the IdP is accessible and responding',
                        'Check network connectivity between SP and IdP',
                        'Ensure CORS is properly configured if using browser-based flows',
                    ],
                    relatedDocs: ['SAML Troubleshooting Guide', 'Common SAML Errors'],
                };
        }

        this.errorDetail.set(errorDetail);
        this.errorMessage.set(errorDetail.message);
    }
}
