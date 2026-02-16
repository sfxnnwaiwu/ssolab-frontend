import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '../services/auth';

/**
 * Auth Guard - Protects routes that require authentication
 * Redirects to /login if user is not authenticated
 */
export const authGuard: CanActivateFn = () => {
    const authService = inject(Auth);
    const router = inject(Router);

    if (authService.isAuthenticated()) {
        return true;
    }

    // Redirect to login page
    return router.createUrlTree(['/login']);
};
