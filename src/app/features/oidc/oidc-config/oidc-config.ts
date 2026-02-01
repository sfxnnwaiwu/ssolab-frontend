import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

interface OidcConfigForm {
    clientId: string;
    clientSecret: string;
    discoveryUrl: string;
    scopes: string[];
    responseType: string;
}

interface ScopeOption {
    value: string;
    label: string;
    description: string;
}

@Component({
    selector: 'app-oidc-config',
    imports: [CommonModule, RouterLink, FormsModule],
    templateUrl: './oidc-config.html',
    styleUrl: './oidc-config.css',
})
export class OidcConfig {
    protected readonly formData = signal<OidcConfigForm>({
        clientId: '',
        clientSecret: '',
        discoveryUrl: '',
        scopes: ['openid', 'profile', 'email'],
        responseType: 'code',
    });

    protected readonly errors = signal<Partial<Record<keyof OidcConfigForm, string>>>({});
    protected readonly isValidating = signal(false);
    protected readonly validationSuccess = signal(false);

    protected readonly availableScopes: ScopeOption[] = [
        { value: 'openid', label: 'openid', description: 'Required for OIDC' },
        { value: 'profile', label: 'profile', description: 'User profile information' },
        { value: 'email', label: 'email', description: 'User email address' },
        { value: 'address', label: 'address', description: 'User postal address' },
        { value: 'phone', label: 'phone', description: 'User phone number' },
        { value: 'offline_access', label: 'offline_access', description: 'Refresh token access' },
    ];

    protected readonly responseTypes = [
        {
            value: 'code',
            label: 'Authorization Code',
            description: 'Most secure flow (recommended)',
        },
        {
            value: 'id_token',
            label: 'Implicit (ID Token)',
            description: 'Legacy flow, less secure',
        },
        { value: 'code id_token', label: 'Hybrid', description: 'Combined flow' },
    ];

    constructor(private router: Router) {}

    onSubmit(): void {
        if (this.validateForm()) {
            // Store config in session/local storage for backend to use
            sessionStorage.setItem('oidc-config', JSON.stringify(this.formData()));
            // Navigate to backend SSO endpoint
            window.location.href = '/api/oidc/login';
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

    toggleScope(scope: string): void {
        const currentScopes = [...this.formData().scopes];
        const index = currentScopes.indexOf(scope);

        // openid is required and cannot be removed
        if (scope === 'openid' && index !== -1) {
            return;
        }

        if (index === -1) {
            currentScopes.push(scope);
        } else {
            currentScopes.splice(index, 1);
        }

        this.formData.set({ ...this.formData(), scopes: currentScopes });

        // Clear scope error if exists
        if (this.errors().scopes) {
            const newErrors = { ...this.errors() };
            delete newErrors.scopes;
            this.errors.set(newErrors);
        }
    }

    isScopeSelected(scope: string): boolean {
        return this.formData().scopes.includes(scope);
    }

    private validateForm(): boolean {
        const newErrors: Partial<Record<keyof OidcConfigForm, string>> = {};
        const data = this.formData();

        if (!data.clientId.trim()) {
            newErrors.clientId = 'Client ID is required';
        }

        if (!data.clientSecret.trim()) {
            newErrors.clientSecret = 'Client Secret is required';
        } else if (data.clientSecret.length < 16) {
            newErrors.clientSecret = 'Client Secret seems too short (minimum 16 characters)';
        }

        if (!data.discoveryUrl.trim()) {
            newErrors.discoveryUrl = 'Discovery URL is required';
        } else if (!this.isValidUrl(data.discoveryUrl)) {
            newErrors.discoveryUrl = 'Discovery URL must be a valid URL';
        } else if (!data.discoveryUrl.startsWith('https://')) {
            newErrors.discoveryUrl = 'Discovery URL must use HTTPS protocol';
        } else if (!data.discoveryUrl.includes('/.well-known/')) {
            // Optional: warn if it doesn't look like a discovery URL
            newErrors.discoveryUrl =
                'Discovery URL should typically include /.well-known/openid-configuration';
        }

        if (!data.scopes.includes('openid')) {
            newErrors.scopes = 'The "openid" scope is required for OIDC';
        }

        if (!data.responseType) {
            newErrors.responseType = 'Response type is required';
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

    updateField(field: keyof OidcConfigForm, value: string): void {
        this.formData.set({ ...this.formData(), [field]: value });
        // Clear error for this field when user starts typing
        if (this.errors()[field]) {
            const newErrors = { ...this.errors() };
            delete newErrors[field];
            this.errors.set(newErrors);
        }
    }

    updateResponseType(value: string): void {
        this.formData.set({ ...this.formData(), responseType: value });
        // Clear error for this field
        if (this.errors().responseType) {
            const newErrors = { ...this.errors() };
            delete newErrors.responseType;
            this.errors.set(newErrors);
        }
    }
}
