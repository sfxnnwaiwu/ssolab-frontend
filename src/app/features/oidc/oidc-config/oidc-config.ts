import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { environment } from '../../../../environments/environment';

interface OidcConfigDto {
    providerName: string;
    issuer: string;
    clientId: string;
    clientSecret: string;
    scopes: string;
}

@Component({
    selector: 'app-oidc-config',
    standalone: true,
    imports: [CommonModule, RouterLink, ReactiveFormsModule],
    templateUrl: './oidc-config.html',
    styleUrl: './oidc-config.css',
})
export class OidcConfig implements OnInit {
    private readonly fb = inject(FormBuilder);
    private readonly http = inject(HttpClient);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly apiUrl = environment.apiUrl;

    readonly saving = signal(false);
    readonly successMessage = signal('');
    readonly errorMessage = signal('');

    readonly configForm = this.fb.nonNullable.group({
        providerName: ['', Validators.required],
        issuer: ['', Validators.required],
        clientId: ['', Validators.required],
        clientSecret: ['', Validators.required],
        scopes: ['openid profile email', Validators.required],
    });

    ngOnInit(): void {
        // Check if we're loading an existing config
        const configId = this.route.snapshot.queryParamMap.get('configId');
        if (configId) {
            this.loadConfiguration(configId);
        }
    }

    loadConfiguration(configId: string): void {
        this.http.get<any>(`${this.apiUrl}/dashboard/configurations/${configId}`).subscribe({
            next: (config) => {
                if (config) {
                    this.configForm.patchValue({
                        providerName: config.providerName,
                        issuer: config.issuer,
                        clientId: config.clientId,
                        clientSecret: config.clientSecret,
                        scopes: config.scopes,
                    });
                }
            },
            error: (error) => {
                console.error('Failed to load configuration:', error);
                this.errorMessage.set('Failed to load configuration');
            },
        });
    }

    onSubmit(): void {
        if (this.configForm.invalid) {
            return;
        }

        this.saving.set(true);
        this.errorMessage.set('');
        this.successMessage.set('');

        const configDto: OidcConfigDto = this.configForm.getRawValue();

        // Save configuration to backend
        this.http
            .post<{ url: string; configId: string }>(`${this.apiUrl}/oidc/config`, configDto)
            .subscribe({
                next: (response) => {
                    this.saving.set(false);
                    // Redirect to OIDC authorization flow
                    window.location.href = response.url;
                },
                error: (error) => {
                    this.saving.set(false);
                    console.error('Failed to save configuration:', error);
                    this.errorMessage.set(error?.error?.message || 'Failed to save configuration');
                },
            });
    }
}
