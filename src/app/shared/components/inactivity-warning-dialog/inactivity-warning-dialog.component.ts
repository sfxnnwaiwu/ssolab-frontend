import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { Subscription, timer } from 'rxjs';
import { tap } from 'rxjs/operators';

/**
 * Dialog component shown when user has been inactive for 3 minutes
 * Displays a 60-second countdown before automatic logout
 */
@Component({
    selector: 'app-inactivity-warning-dialog',
    standalone: true,
    imports: [MatDialogModule, MatButtonModule, MatIconModule],
    templateUrl: './inactivity-warning-dialog.component.html',
})
export class InactivityWarningDialogComponent implements OnInit, OnDestroy {
    private dialogRef = inject(MatDialogRef<InactivityWarningDialogComponent>);

    countdown = signal(60);
    private countdownSubscription?: Subscription;

    ngOnInit(): void {
        // Start countdown from 60 seconds
        this.countdownSubscription = timer(0, 1000)
            .pipe(
                tap((elapsed) => {
                    const newCountdown = 60 - elapsed;
                    this.countdown.set(newCountdown);

                    // Auto-close and trigger logout when countdown reaches 0
                    if (newCountdown <= 0) {
                        this.dialogRef.close('timeout');
                    }
                })
            )
            .subscribe();
    }

    ngOnDestroy(): void {
        this.countdownSubscription?.unsubscribe();
    }

    /**
     * User clicked "Stay Logged In" button
     */
    onStayLoggedIn(): void {
        this.dialogRef.close('continue');
    }
}
