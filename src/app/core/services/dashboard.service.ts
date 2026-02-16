import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
    DashboardConfigurations,
    OidcConfiguration,
    SamlConfiguration,
    TestResult,
} from '../models/configuration.model';

@Injectable({
    providedIn: 'root',
})
export class DashboardService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = environment.apiUrl;

    /**
     * Get all configurations (SAML and OIDC) for the current user
     */
    getConfigurations(): Observable<DashboardConfigurations> {
        return this.http.get<DashboardConfigurations>(`${this.apiUrl}/dashboard/configurations`);
    }

    /**
     * Get a specific configuration by ID
     */
    getConfigurationById(
        configId: string
    ): Observable<SamlConfiguration | OidcConfiguration | null> {
        return this.http.get<SamlConfiguration | OidcConfiguration | null>(
            `${this.apiUrl}/dashboard/configurations/${configId}`
        );
    }

    /**
     * Delete a configuration
     */
    deleteConfiguration(configId: string): Observable<{ deleted: boolean }> {
        return this.http.delete<{ deleted: boolean }>(
            `${this.apiUrl}/dashboard/configurations/${configId}`
        );
    }

    /**
     * Get test results for a configuration
     */
    getTestResults(configId: string, limit: number = 10): Observable<TestResult[]> {
        return this.http.get<TestResult[]>(
            `${this.apiUrl}/dashboard/test-results/${configId}?limit=${limit}`
        );
    }
}
