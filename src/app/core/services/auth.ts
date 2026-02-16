import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, catchError, Observable, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { StorageKeys } from '../constants/storage-keys';
import { AuthResponse, LoginDto, RefreshResponse, SignupDto, User } from '../models/auth.model';
import { ErrorAuthResult, SamlAuthResult, SessionAuthResult } from '../models/sso-test.model';

@Injectable({
    providedIn: 'root',
})
export class Auth {
    private readonly http = inject(HttpClient);
    private readonly router = inject(Router);
    private readonly apiUrl = environment.apiUrl;

    // Signal-based state
    private readonly currentUserSignal = signal<User | null>(null);
    private readonly accessTokenSignal = signal<string | null>(null);
    private readonly loadingSignal = signal<boolean>(false);

    // Public signals (readonly)
    readonly currentUser = this.currentUserSignal.asReadonly();
    readonly accessToken = this.accessTokenSignal.asReadonly();
    readonly loading = this.loadingSignal.asReadonly();
    readonly isAuthenticated = computed(() => this.currentUserSignal() !== null);

    // Token refresh subject for interceptor coordination
    private readonly tokenRefreshSubject = new BehaviorSubject<string | null>(null);
    readonly tokenRefresh$ = this.tokenRefreshSubject.asObservable();

    constructor() {
        // Load token from localStorage on initialization
        this.loadTokenFromStorage();
    }

    /**
     * Sign up a new user
     */
    signup(dto: SignupDto): Observable<AuthResponse> {
        this.loadingSignal.set(true);
        return this.http.post<AuthResponse>(`${this.apiUrl}/auth/signup`, dto).pipe(
            tap((response) => {
                this.setAuthData(response);
                this.loadingSignal.set(false);
            }),
            catchError((error) => {
                this.loadingSignal.set(false);
                return throwError(() => error);
            })
        );
    }

    /**
     * Log in an existing user
     */
    login(dto: LoginDto): Observable<AuthResponse> {
        this.loadingSignal.set(true);
        return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, dto).pipe(
            tap((response) => {
                this.setAuthData(response);
                this.loadingSignal.set(false);
            }),
            catchError((error) => {
                this.loadingSignal.set(false);
                return throwError(() => error);
            })
        );
    }

    /**
     * Log out the current user
     */
    logout(): Observable<void> {
        return this.http.post<void>(`${this.apiUrl}/auth/logout`, {}).pipe(
            tap(() => {
                this.clearAuthData();
                this.router.navigate(['/login']);
            }),
            catchError((error) => {
                // Clear local data even if API call fails
                this.clearAuthData();
                this.router.navigate(['/login']);
                return throwError(() => error);
            })
        );
    }

    /**
     * Refresh access token using refresh token (httpOnly cookie)
     */
    refreshAccessToken(): Observable<RefreshResponse> {
        return this.http.post<RefreshResponse>(`${this.apiUrl}/auth/refresh`, {}).pipe(
            tap((response) => {
                this.accessTokenSignal.set(response.accessToken);
                this.tokenRefreshSubject.next(response.accessToken);
            }),
            catchError((error) => {
                this.clearAuthData();
                this.router.navigate(['/login']);
                return throwError(() => error);
            })
        );
    }

    /**
     * Get current user profile
     */
    getCurrentUser(): Observable<User> {
        return this.http.get<User>(`${this.apiUrl}/auth/me`).pipe(
            tap((user) => {
                this.currentUserSignal.set(user);
            })
        );
    }

    /**
     * Initialize auth state on app startup
     */
    initializeAuth(): Observable<User> {
        this.loadingSignal.set(true);
        return this.getCurrentUser().pipe(
            tap(() => {
                this.loadingSignal.set(false);
            }),
            catchError((error) => {
                this.loadingSignal.set(false);
                this.clearAuthData();
                return throwError(() => error);
            })
        );
    }

    /**
     * Set authentication data
     */
    private setAuthData(response: AuthResponse): void {
        this.currentUserSignal.set(response.user);
        this.accessTokenSignal.set(response.accessToken);
        this.tokenRefreshSubject.next(response.accessToken);

        // Persist token to localStorage
        localStorage.setItem(StorageKeys.ACCESS_TOKEN, response.accessToken);
        localStorage.setItem(StorageKeys.USER_DATA, JSON.stringify(response.user));
    }

    /**
     * Clear authentication data
     */
    private clearAuthData(): void {
        this.currentUserSignal.set(null);
        this.accessTokenSignal.set(null);
        this.tokenRefreshSubject.next(null);

        // Remove token from localStorage
        localStorage.removeItem(StorageKeys.ACCESS_TOKEN);
        localStorage.removeItem(StorageKeys.USER_DATA);
    }

    /**
     * Get access token value (for interceptor)
     */
    getAccessToken(): string | null {
        return this.accessTokenSignal();
    }

    /**
     * Load token from localStorage on initialization
     */
    private loadTokenFromStorage(): void {
        const token = localStorage.getItem(StorageKeys.ACCESS_TOKEN);
        const userData = localStorage.getItem(StorageKeys.USER_DATA);

        if (token) {
            this.accessTokenSignal.set(token);
            this.tokenRefreshSubject.next(token);
        }

        if (userData) {
            try {
                const user = JSON.parse(userData) as User;
                this.currentUserSignal.set(user);
            } catch (error) {
                console.error('Failed to parse user data from localStorage:', error);
                localStorage.removeItem(StorageKeys.USER_DATA);
            }
        }
    }

    /**
     * Get SSO test authentication result from backend session
     * This retrieves the SAML or OIDC test result after IdP callback
     */
    getSessionAuthResult(resultId: string): Observable<SessionAuthResult> {
        return this.http.get<SessionAuthResult>(
            `${this.apiUrl}/session/auth-result?resultId=${resultId}`
        );
    }

    fetchAuthResultFromSession() {
        return this.http.get(`${this.apiUrl}/api/session/auth-result`);
    }

    /**
     * Clear SSO test session data
     * This clears temporary session data after viewing test results
     */
    clearSession(): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/session/clear`);
    }

    // validateSamlResponse(
    //     samlResponse: string,
    //     relayState: string | null
    // ): Observable<SamlAuthResult | ErrorAuthResult> {
    //     return this.http.post<SamlAuthResult | ErrorAuthResult>(`${this.apiUrl}/saml/validate`, {
    //         SAMLResponse: samlResponse,
    //         RelayState: relayState,
    //     });
    // }
}
