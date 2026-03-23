import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Auth } from '../../../core/services/auth';
import {
    getPasswordStrengthErrors,
    passwordMatchValidator,
    passwordStrengthValidator,
} from '../../../shared/validators/password.validator';

@Component({
    selector: 'app-change-password',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './change-password.component.html',
})
export class ChangePasswordComponent {
    private readonly fb = inject(FormBuilder);
    private readonly http = inject(HttpClient);
    private readonly authService = inject(Auth);

    readonly loading = signal(false);
    readonly errorMessage = signal<string>('');
    readonly successMessage = signal<string>('');
    readonly showPasswordStrengthErrors = signal(false);
    readonly isOpen = signal(false);

    readonly changePasswordForm = this.fb.nonNullable.group(
        {
            currentPassword: ['', [Validators.required]],
            newPassword: ['', [Validators.required, passwordStrengthValidator()]],
            confirmPassword: ['', [Validators.required]],
        },
        { validators: passwordMatchValidator('newPassword', 'confirmPassword') }
    );

    // For displaying password strength errors in template
    passwordStrengthErrorList = signal<string[]>([]);

    constructor() {
        // Watch for password changes to update strength error messages
        effect(() => {
            if (this.changePasswordForm.get('newPassword')?.touched) {
                const errors = getPasswordStrengthErrors(
                    this.changePasswordForm.get('newPassword')!
                );
                this.passwordStrengthErrorList.set(errors);
            }
        });
    }

    openModal(): void {
        this.isOpen.set(true);
        this.errorMessage.set('');
        this.successMessage.set('');
        this.changePasswordForm.reset();
    }

    closeModal(): void {
        this.isOpen.set(false);
        this.errorMessage.set('');
        this.successMessage.set('');
        this.changePasswordForm.reset();
    }

    onSubmit(): void {
        if (this.changePasswordForm.invalid) {
            return;
        }

        this.loading.set(true);
        this.errorMessage.set('');
        this.successMessage.set('');

        const { currentPassword, newPassword, confirmPassword } =
            this.changePasswordForm.getRawValue();

        const payload = {
            currentPassword,
            newPassword,
            confirmPassword,
        };

        this.http.post<{ message: string }>('/api/auth/change-password', payload).subscribe({
            next: (response) => {
                this.loading.set(false);
                this.successMessage.set(response.message || 'Password changed successfully!');
                setTimeout(() => {
                    this.closeModal();
                }, 1500);
            },
            error: (error) => {
                this.loading.set(false);
                const message =
                    error?.error?.message || 'Failed to change password. Please try again.';
                this.errorMessage.set(message);
            },
        });
    }

    onPasswordChange(): void {
        this.showPasswordStrengthErrors.set(
            this.changePasswordForm.get('newPassword')?.touched ?? false
        );
    }
}
