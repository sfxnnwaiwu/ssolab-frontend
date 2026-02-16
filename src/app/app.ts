import { Component, effect, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router, RouterOutlet } from '@angular/router';
import { Subscription } from 'rxjs';
import { StorageKeys } from './core/constants/storage-keys';
import { Auth } from './core/services/auth';
import { InactivityService } from './core/services/inactivity.service';
import { InactivityWarningDialogComponent } from './shared/components/inactivity-warning-dialog/inactivity-warning-dialog.component';

@Component({
    selector: 'app-root',
    imports: [RouterOutlet],
    templateUrl: './app.html',
    styleUrl: './app.css',
})
export class App implements OnInit, OnDestroy {
    protected readonly title = signal('testing-application');

    private readonly auth = inject(Auth);
    private readonly inactivityService = inject(InactivityService);
    private readonly dialog = inject(MatDialog);
    private readonly router = inject(Router);

    private warningSubscription?: Subscription;
    private storageEventHandler = this.handleStorageEvent.bind(this);

    constructor() {
        // React to authentication state changes using effect
        effect(() => {
            const isAuth = this.auth.isAuthenticated();

            if (isAuth) {
                this.startInactivityMonitoring();
            } else {
                this.stopInactivityMonitoring();
            }
        });
    }

    ngOnInit(): void {
        // Initialize authentication from stored token
        this.initializeAuth();

        // Listen for storage events to sync logout across tabs
        window.addEventListener('storage', this.storageEventHandler);
    }

    ngOnDestroy(): void {
        this.warningSubscription?.unsubscribe();
        this.inactivityService.stopMonitoring();
        window.removeEventListener('storage', this.storageEventHandler);
    }

    /**
     * Initialize authentication from localStorage token
     */
    private initializeAuth(): void {
        const token = this.auth.getAccessToken();

        if (token) {
            // Token exists, validate it by fetching user data
            this.auth.initializeAuth().subscribe({
                next: () => {
                    console.log('Authentication restored from stored token');
                },
                error: (error) => {
                    console.error('Failed to restore authentication:', error);
                    // Token is likely expired, will be cleared by interceptor
                },
            });
        }
    }

    /**
     * Start monitoring user inactivity
     */
    private startInactivityMonitoring(): void {
        // Subscribe to inactivity warnings
        this.warningSubscription = this.inactivityService.warning$.subscribe(() => {
            this.showInactivityWarning();
        });

        // Start monitoring
        this.inactivityService.startMonitoring();
    }

    /**
     * Stop monitoring user inactivity
     */
    private stopInactivityMonitoring(): void {
        this.warningSubscription?.unsubscribe();
        this.inactivityService.stopMonitoring();
    }

    /**
     * Show inactivity warning dialog
     */
    private showInactivityWarning(): void {
        // Prevent multiple dialogs
        if (this.dialog.openDialogs.length > 0) {
            return;
        }

        const dialogRef = this.dialog.open(InactivityWarningDialogComponent, {
            disableClose: true, // User must click button
            width: '450px',
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result === 'continue') {
                // User chose to stay logged in
                this.inactivityService.resetTimer();
            } else if (result === 'timeout') {
                // Countdown expired, logout user
                this.handleInactivityTimeout();
            }
        });
    }

    /**
     * Handle automatic logout due to inactivity
     */
    private handleInactivityTimeout(): void {
        this.auth.logout().subscribe({
            next: () => {
                console.log('User logged out due to inactivity');
            },
            error: (error) => {
                console.error('Logout error:', error);
            },
        });
    }

    /**
     * Handle storage events from other tabs
     * Synchronizes logout across multiple tabs
     */
    private handleStorageEvent(event: StorageEvent): void {
        // Check if access token was removed in another tab
        if (event.key === StorageKeys.ACCESS_TOKEN && event.newValue === null) {
            // Token was removed, clear auth state and redirect to login
            console.log('Logout detected in another tab, synchronizing...');

            // Clear local auth state (without calling API since other tab already did)
            this.auth['clearAuthData'](); // Access private method via bracket notation

            // Close any open dialogs
            this.dialog.closeAll();

            // Stop inactivity monitoring
            this.inactivityService.stopMonitoring();

            // Redirect to login
            this.router.navigate(['/login']);
        }

        // Check if a new token was set in another tab (user logged in)
        if (
            event.key === StorageKeys.ACCESS_TOKEN &&
            event.newValue !== null &&
            event.oldValue === null
        ) {
            console.log('Login detected in another tab, synchronizing...');

            // Reload the page to reinitialize the app with the new auth state
            window.location.reload();
        }
    }
}
