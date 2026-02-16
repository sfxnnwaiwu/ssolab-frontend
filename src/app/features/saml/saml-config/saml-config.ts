import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { environment } from '../../../../environments/environment';

interface SamlConfigDto {
    idpName: string;
    entityId: string;
    ssoUrl: string;
    certificate: string;
}

@Component({
    selector: 'app-saml-config',
    standalone: true,
    imports: [CommonModule, RouterLink, ReactiveFormsModule],
    templateUrl: './saml-config.html',
    styleUrl: './saml-config.css',
})
export class SamlConfig implements OnInit {
    private readonly fb = inject(FormBuilder);
    private readonly http = inject(HttpClient);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly apiUrl = environment.apiUrl;

    readonly saving = signal(false);
    readonly successMessage = signal('');
    readonly errorMessage = signal('');

    readonly configForm = this.fb.nonNullable.group({
        idpName: ['', Validators.required],
        entityId: ['', Validators.required],
        ssoUrl: ['', Validators.required],
        certificate: ['', Validators.required],
    });

    ngOnInit(): void {
        // Check if we're loading an existing config
        const configId = this.route.snapshot.queryParamMap.get('configId');
        console.log('SAML Config - ngOnInit - configId:', configId);
        if (configId) {
            this.loadConfiguration(configId);
        }
    }

    loadConfiguration(configId: string): void {
        this.http.get<any>(`${this.apiUrl}/dashboard/configurations/${configId}`).subscribe({
            next: (config) => {
                if (config) {
                    this.configForm.patchValue({
                        idpName: config.name,
                        entityId: config.entityId,
                        ssoUrl: config.ssoUrl,
                        certificate: config.certificate,
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

        const configDto: SamlConfigDto = this.configForm.getRawValue();

        // Save configuration to backend
        this.http
            .post<{ url: string; configId: string }>(`${this.apiUrl}/saml/config`, configDto)
            .subscribe({
                next: (response) => {
                    this.saving.set(false);
                    // Redirect to SAML SSO flow
                    console.log('SAML Config - onSubmit - redirecting to:', response.url);
                    setTimeout(() => {
                        window.location.href = response.url;
                    }, 10000);
                },
                error: (error) => {
                    this.saving.set(false);
                    console.error('Failed to save configuration:', error);
                    this.errorMessage.set(error?.error?.message || 'Failed to save configuration');
                },
            });
    }
}
