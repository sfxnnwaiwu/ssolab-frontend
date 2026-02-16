import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Auth } from '../services/auth';

/**
 * HTTP Interceptor that attaches JWT access token to outgoing requests
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const authService = inject(Auth);
    const accessToken = authService.getAccessToken();

    // Don't add token to auth endpoints (signup, login, refresh)
    const isAuthEndpoint =
        req.url.includes('/auth/signup') ||
        req.url.includes('/auth/login') ||
        req.url.includes('/auth/refresh');

    if (accessToken && !isAuthEndpoint) {
        // Clone request and add Authorization header
        const authReq = req.clone({
            setHeaders: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
        return next(authReq);
    }

    return next(req);
};
