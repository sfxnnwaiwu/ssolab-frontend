import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { SignupDto } from '../../../core/models/auth.model';
import { Auth } from '../../../core/services/auth';

@Component({
    selector: 'app-signup',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterLink],
    templateUrl: './signup.component.html',
})
export class SignupComponent {
    private readonly fb = inject(FormBuilder);
    private readonly authService = inject(Auth);
    private readonly router = inject(Router);

    readonly loading = this.authService.loading;
    readonly errorMessage = signal<string>('');

    readonly signupForm = this.fb.nonNullable.group(
        {
            name: ['', [Validators.required, Validators.minLength(2)]],
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.minLength(6)]],
            confirmPassword: ['', [Validators.required]],
        },
        { validators: this.passwordMatchValidator }
    );

    passwordMatchValidator(formGroup: any) {
        const password = formGroup.get('password')?.value;
        const confirmPassword = formGroup.get('confirmPassword')?.value;
        return password === confirmPassword ? null : { passwordMismatch: true };
    }

    onSubmit(): void {
        if (this.signupForm.invalid) {
            return;
        }

        this.errorMessage.set('');
        const formValue = this.signupForm.getRawValue();
        const signupDto: SignupDto = {
            name: formValue.name,
            email: formValue.email,
            password: formValue.password,
        };

        this.authService.signup(signupDto).subscribe({
            next: () => {
                this.router.navigate(['/dashboard']);
            },
            error: (error) => {
                console.error('Signup error:', error);
                const message = error?.error?.message || 'Failed to create account';
                this.errorMessage.set(message);
            },
        });
    }
}
