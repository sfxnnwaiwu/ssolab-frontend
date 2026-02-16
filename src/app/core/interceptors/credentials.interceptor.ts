import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';

/**
 * HTTP Interceptor that adds credentials (cookies) to backend API requests
 * This enables session-based authentication for SSO testing flows
 */
export const credentialsInterceptor: HttpInterceptorFn = (req, next) => {
    // Only add credentials to requests going to our backend API
    const isBackendRequest = req.url.startsWith(environment.apiUrl) || req.url.startsWith('/api');

    if (isBackendRequest) {
        // Clone request and add withCredentials flag
        const credentialReq = req.clone({
            withCredentials: true,
        });
        return next(credentialReq);
    }

    return next(req);
};
