import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

interface SamlConfigForm {
    idpName: string;
    entityId: string;
    ssoUrl: string;
    certificate: string;
}

@Component({
    selector: 'app-saml-config',
    imports: [CommonModule, RouterLink, FormsModule],
    templateUrl: './saml-config.html',
    styleUrl: './saml-config.css',
})
export class SamlConfig {
    protected readonly formData = signal<SamlConfigForm>({
        idpName: '',
        entityId: '',
        ssoUrl: '',
        certificate: '',
    });

    protected readonly errors = signal<Partial<SamlConfigForm>>({});
    protected readonly isValidating = signal(false);
    protected readonly validationSuccess = signal(false);

    constructor(private router: Router) {}

    onSubmit(): void {
        if (this.validateForm()) {
            // Store config in session/local storage for backend to use
            sessionStorage.setItem('saml-config', JSON.stringify(this.formData()));
            // Navigate to backend SSO endpoint
            window.location.href = '/api/saml/login';
        }
    }

    onTestConnection(): void {
        if (this.validateForm()) {
            this.isValidating.set(true);
            this.validationSuccess.set(false);

            // Simulate validation - in real app, this would call backend
            setTimeout(() => {
                this.isValidating.set(false);
                this.validationSuccess.set(true);

                // Reset success message after 3 seconds
                setTimeout(() => this.validationSuccess.set(false), 3000);
            }, 1500);
        }
    }

    private validateForm(): boolean {
        const newErrors: Partial<SamlConfigForm> = {};
        const data = this.formData();

        if (!data.idpName.trim()) {
            newErrors.idpName = 'IdP Name is required';
        }

        if (!data.entityId.trim()) {
            newErrors.entityId = 'Entity ID is required';
        } else if (!this.isValidUrl(data.entityId)) {
            newErrors.entityId = 'Entity ID must be a valid URL';
        }

        if (!data.ssoUrl.trim()) {
            newErrors.ssoUrl = 'SSO URL is required';
        } else if (!this.isValidUrl(data.ssoUrl)) {
            newErrors.ssoUrl = 'SSO URL must be a valid HTTPS URL';
        } else if (!data.ssoUrl.startsWith('https://')) {
            newErrors.ssoUrl = 'SSO URL must use HTTPS protocol';
        }

        if (!data.certificate.trim()) {
            newErrors.certificate = 'Certificate is required';
        } else if (!this.isValidCertificate(data.certificate)) {
            newErrors.certificate =
                'Certificate must be in PEM format (BEGIN CERTIFICATE / END CERTIFICATE)';
        }

        this.errors.set(newErrors);
        return Object.keys(newErrors).length === 0;
    }

    private isValidUrl(url: string): boolean {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    private isValidCertificate(cert: string): boolean {
        return cert.includes('BEGIN CERTIFICATE') && cert.includes('END CERTIFICATE');
    }

    updateField(field: keyof SamlConfigForm, value: string): void {
        this.formData.set({ ...this.formData(), [field]: value });
        // Clear error for this field when user starts typing
        if (this.errors()[field]) {
            const newErrors = { ...this.errors() };
            delete newErrors[field];
            this.errors.set(newErrors);
        }
    }
}
