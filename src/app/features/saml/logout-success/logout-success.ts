import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
    selector: 'app-logout-success',
    imports: [CommonModule],
    templateUrl: './logout-success.html',
    styleUrl: './logout-success.css',
})
export class LogoutSuccess {
    private readonly router = inject(Router);

    navigateToDashboard(): void {
        this.router.navigate(['/dashboard']);
    }

    navigateToLogin(): void {
        this.router.navigate(['/login']);
    }
}
