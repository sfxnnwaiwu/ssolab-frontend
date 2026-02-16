import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LoginDto } from '../../../core/models/auth.model';
import { Auth } from '../../../core/services/auth';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterLink],
    templateUrl: './login.component.html',
})
export class LoginComponent {
    private readonly fb = inject(FormBuilder);
    private readonly authService = inject(Auth);
    private readonly router = inject(Router);

    readonly loading = this.authService.loading;
    readonly errorMessage = signal<string>('');

    readonly loginForm = this.fb.nonNullable.group({
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required]],
    });

    onSubmit(): void {
        if (this.loginForm.invalid) {
            return;
        }

        this.errorMessage.set('');
        const loginDto: LoginDto = this.loginForm.getRawValue();

        this.authService.login(loginDto).subscribe({
            next: (response) => {
                console.log('Login successful:', response);
                this.router.navigate(['/dashboard']);
            },
            error: (error) => {
                console.error('Login error:', error);
                const message = error?.error?.message || 'Invalid email or password';
                this.errorMessage.set(message);
            },
        });
    }
}
