import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, filter, switchMap, take, throwError } from 'rxjs';
import { Auth } from '../services/auth';

/**
 * HTTP Interceptor that handles errors and refreshes tokens on 401
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
    const authService = inject(Auth);

    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            // Handle 401 Unauthorized errors
            if (error.status === 401) {
                // Don't try to refresh if we're already on auth endpoints
                const isAuthEndpoint =
                    req.url.includes('/auth/login') ||
                    req.url.includes('/auth/signup') ||
                    req.url.includes('/auth/refresh');

                if (!isAuthEndpoint) {
                    // Try to refresh the token
                    return authService.refreshAccessToken().pipe(
                        switchMap(() => {
                            // Wait for the new token to be set
                            return authService.tokenRefresh$.pipe(
                                filter((token) => token !== null),
                                take(1),
                                switchMap((token) => {
                                    // Retry the original request with new token
                                    const retryReq = req.clone({
                                        setHeaders: {
                                            Authorization: `Bearer ${token}`,
                                        },
                                    });
                                    return next(retryReq);
                                })
                            );
                        }),
                        catchError((refreshError) => {
                            // Refresh failed - auth service will clear localStorage and redirect to login
                            // clearAuthData() is called in refreshAccessToken() on error
                            return throwError(() => refreshError);
                        })
                    );
                }
            }

            // For all other errors, just pass them through
            return throwError(() => error);
        })
    );
};
