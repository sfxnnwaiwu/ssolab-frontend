import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { environment } from '../../../../environments/environment';

@Component({
    selector: 'app-forgot-password',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterLink],
    templateUrl: './forgot-password.component.html',
})
export class ForgotPasswordComponent {
    private readonly fb = inject(FormBuilder);
    private readonly http = inject(HttpClient);
    private readonly router = inject(Router);
    private readonly apiUrl = environment.apiUrl;

    readonly loading = signal(false);
    readonly errorMessage = signal<string>('');
    readonly successMessage = signal<string>('');

    readonly forgotPasswordForm = this.fb.nonNullable.group({
        email: ['', [Validators.required, Validators.email]],
    });

    onSubmit(): void {
        if (this.forgotPasswordForm.invalid) {
            return;
        }

        this.loading.set(true);
        this.errorMessage.set('');
        this.successMessage.set('');

        const email = this.forgotPasswordForm.getRawValue().email;

        this.http
            .post<{ message: string }>(`${this.apiUrl}/auth/request-password-reset`, { email })
            .subscribe({
                next: (response) => {
                    this.loading.set(false);
                    this.successMessage.set(
                        response.message || 'Check your email for a password reset link'
                    );
                    this.forgotPasswordForm.reset();
                    // Optionally redirect to login after a few seconds
                    setTimeout(() => {
                        this.router.navigate(['/login']);
                    }, 3000);
                },
                error: (error) => {
                    this.loading.set(false);
                    const message =
                        error?.error?.message ||
                        'Failed to send password reset link. Please try again.';
                    this.errorMessage.set(message);
                },
            });
    }
}
