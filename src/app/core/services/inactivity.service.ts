import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, fromEvent, merge, Subject, Subscription, timer } from 'rxjs';
import { debounceTime, filter, tap } from 'rxjs/operators';

/**
 * Service to track user inactivity and trigger warnings
 *
 * Configuration:
 * - Inactivity timeout: 3 minutes (180,000 ms)
 * - Warning countdown: 60 seconds
 * - Total time before auto-logout: 4 minutes
 */
@Injectable({
    providedIn: 'root',
})
export class InactivityService {
    // Configuration
    private readonly INACTIVITY_TIMEOUT = 3 * 60 * 1000; // 3 minutes in milliseconds
    private readonly WARNING_DURATION = 60; // 60 seconds countdown

    // State
    private activitySubscription?: Subscription;
    private warningSubject = new Subject<void>();
    private countdownSubject = new BehaviorSubject<number>(0);
    private isMonitoringSubject = new BehaviorSubject<boolean>(false);
    private countdownTimer?: Subscription;

    // Public observables
    readonly warning$ = this.warningSubject.asObservable();
    readonly countdown$ = this.countdownSubject.asObservable();
    readonly isMonitoring$ = this.isMonitoringSubject.asObservable();

    constructor(private ngZone: NgZone) {}

    /**
     * Start monitoring user activity
     */
    startMonitoring(): void {
        if (this.isMonitoringSubject.value) {
            return; // Already monitoring
        }

        this.isMonitoringSubject.next(true);

        // Run outside Angular zone for performance
        this.ngZone.runOutsideAngular(() => {
            // Activity events to monitor
            const activityEvents = [
                fromEvent(document, 'mousemove'),
                fromEvent(document, 'mousedown'),
                fromEvent(document, 'keydown'),
                fromEvent(document, 'scroll', { passive: true }),
                fromEvent(document, 'touchstart', { passive: true }),
                fromEvent(document, 'click'),
            ];

            // Merge all activity events and debounce
            this.activitySubscription = merge(...activityEvents)
                .pipe(
                    debounceTime(this.INACTIVITY_TIMEOUT),
                    tap(() => {
                        // Run the warning trigger back in Angular zone
                        this.ngZone.run(() => {
                            this.triggerWarning();
                        });
                    })
                )
                .subscribe();
        });
    }

    /**
     * Stop monitoring user activity
     */
    stopMonitoring(): void {
        this.activitySubscription?.unsubscribe();
        this.activitySubscription = undefined;
        this.stopCountdown();
        this.isMonitoringSubject.next(false);
        this.countdownSubject.next(0);
    }

    /**
     * Reset the inactivity timer (called when user explicitly continues session)
     */
    resetTimer(): void {
        this.stopCountdown();
        this.stopMonitoring();
        this.startMonitoring();
    }

    /**
     * Trigger the inactivity warning and start countdown
     */
    private triggerWarning(): void {
        // Stop activity monitoring during warning
        this.activitySubscription?.unsubscribe();
        this.activitySubscription = undefined;

        // Emit warning event
        this.warningSubject.next();

        // Start countdown
        this.startCountdown();
    }

    /**
     * Start the countdown timer
     */
    private startCountdown(): void {
        this.countdownSubject.next(this.WARNING_DURATION);

        // Timer that emits every second
        this.countdownTimer = timer(0, 1000)
            .pipe(
                tap((elapsed) => {
                    const remaining = this.WARNING_DURATION - elapsed;

                    if (remaining >= 0) {
                        this.countdownSubject.next(remaining);
                    } else {
                        // Countdown finished - this will be handled by the dialog component
                        this.stopCountdown();
                    }
                }),
                filter((elapsed) => elapsed <= this.WARNING_DURATION)
            )
            .subscribe();
    }

    /**
     * Stop the countdown timer
     */
    private stopCountdown(): void {
        this.countdownTimer?.unsubscribe();
        this.countdownTimer = undefined;
        this.countdownSubject.next(0);
    }

    /**
     * Clean up on service destroy
     */
    ngOnDestroy(): void {
        this.stopMonitoring();
    }
}
