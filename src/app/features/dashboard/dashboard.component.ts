import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal, ViewChild } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DashboardConfigurations } from '../../core/models/configuration.model';
import { Auth } from '../../core/services/auth';
import { DashboardService } from '../../core/services/dashboard.service';
import { ChangePasswordComponent } from './change-password/change-password.component';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule, RouterLink, ChangePasswordComponent],
    templateUrl: `./dashboard.component.html`,
})
export class DashboardComponent implements OnInit {
    private readonly authService = inject(Auth);
    private readonly dashboardService = inject(DashboardService);
    private readonly router = inject(Router);

    @ViewChild(ChangePasswordComponent) changePasswordComponent?: ChangePasswordComponent;

    readonly currentUser = this.authService.currentUser;
    readonly loading = signal(false);
    readonly configurations = signal<DashboardConfigurations | null>(null);

    ngOnInit(): void {
        this.loadConfigurations();
    }

    loadConfigurations(): void {
        this.loading.set(true);
        this.dashboardService.getConfigurations().subscribe({
            next: (configs) => {
                this.configurations.set(configs);
                this.loading.set(false);
            },
            error: (error) => {
                console.error('Failed to load configurations:', error);
                this.loading.set(false);
            },
        });
    }

    deleteConfig(configId: string): void {
        if (!confirm('Are you sure you want to delete this configuration?')) {
            return;
        }

        this.dashboardService.deleteConfiguration(configId).subscribe({
            next: () => {
                this.loadConfigurations();
            },
            error: (error) => {
                console.error('Failed to delete configuration:', error);
                alert('Failed to delete configuration');
            },
        });
    }

    logout(): void {
        this.authService.logout().subscribe();
    }

    openChangePassword(): void {
        this.changePasswordComponent?.openModal();
    }

    formatDate(dateString: string): string {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    }
}
