import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '../services/auth';

/**
 * Guest Guard - Prevents authenticated users from accessing login/signup
 * Redirects to /dashboard if user is already authenticated
 */
export const guestGuard: CanActivateFn = () => {
    const authService = inject(Auth);
    const router = inject(Router);

    if (!authService.isAuthenticated()) {
        return true;
    }

    // Redirect to dashboard if already logged in
    return router.createUrlTree(['/dashboard']);
};
