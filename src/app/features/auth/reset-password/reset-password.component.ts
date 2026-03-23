import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, effect, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
    getPasswordStrengthErrors,
    passwordMatchValidator,
    passwordStrengthValidator,
} from '../../../shared/validators/password.validator';
import { environment } from '../../../../environments/environment';

@Component({
    selector: 'app-reset-password',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterLink],
    templateUrl: './reset-password.component.html',
})
export class ResetPasswordComponent implements OnInit {
    private readonly fb = inject(FormBuilder);
    private readonly http = inject(HttpClient);
    private readonly router = inject(Router);
    private readonly route = inject(ActivatedRoute);

    readonly loading = signal(false);
    readonly validatingToken = signal(true);
    readonly errorMessage = signal<string>('');
    readonly successMessage = signal<string>('');
    readonly tokenValid = signal(false);
    readonly resetToken = signal<string>('');
    readonly showPasswordStrengthErrors = signal(false);

    readonly resetPasswordForm = this.fb.nonNullable.group(
        {
            newPassword: ['', [Validators.required, passwordStrengthValidator()]],
            confirmPassword: ['', [Validators.required]],
        },
        { validators: passwordMatchValidator() }
    );

    // For displaying password strength errors in template
    passwordStrengthErrorList = signal<string[]>([]);
    private readonly apiUrl = environment.apiUrl;

    constructor() {
        // Watch for password changes to update strength error messages
        effect(() => {
            if (this.resetPasswordForm.get('newPassword')?.touched) {
                const errors = getPasswordStrengthErrors(
                    this.resetPasswordForm.get('newPassword')!
                );
                this.passwordStrengthErrorList.set(errors);
            }
        });
    }

    ngOnInit(): void {
        // Extract token from query params
        this.route.queryParams.subscribe((params) => {
            const token = params['token'];

            if (!token) {
                this.errorMessage.set(
                    'No password reset token provided. Please check your email link.'
                );
                this.validatingToken.set(false);
                return;
            }

            this.resetToken.set(token);

            this.http
                .get<{
                    valid: boolean;
                    email?: string;
                }>(`${this.apiUrl}/auth/validate-reset-token/${token}`)
                .subscribe({
                    next: (response) => {
                        this.validatingToken.set(false);
                        if (response.valid) {
                            this.tokenValid.set(true);
                        } else {
                            this.errorMessage.set(
                                'Invalid or expired password reset link. Please request a new one.'
                            );
                        }
                    },
                    error: () => {
                        this.validatingToken.set(false);
                        this.errorMessage.set(
                            'Invalid or expired password reset link. Please request a new one.'
                        );
                    },
                });
        });
    }

    onSubmit(): void {
        if (this.resetPasswordForm.invalid || !this.resetToken()) {
            return;
        }

        this.loading.set(true);
        this.errorMessage.set('');
        this.successMessage.set('');

        const { newPassword, confirmPassword } = this.resetPasswordForm.getRawValue();

        const payload = {
            token: this.resetToken(),
            newPassword,
            confirmPassword,
        };

        this.http
            .post<{ message: string }>(`${this.apiUrl}/auth/reset-password`, payload)
            .subscribe({
                next: (response) => {
                    this.loading.set(false);
                    this.successMessage.set(response.message || 'Password reset successfully!');
                    setTimeout(() => {
                        this.router.navigate(['/login']);
                    }, 2000);
                },
                error: (error) => {
                    this.loading.set(false);
                    const message =
                        error?.error?.message ||
                        'Failed to reset password. Please try again or request a new link.';
                    this.errorMessage.set(message);
                },
            });
    }

    onPasswordChange(): void {
        this.showPasswordStrengthErrors.set(
            this.resetPasswordForm.get('newPassword')?.touched ?? false
        );
    }
}
