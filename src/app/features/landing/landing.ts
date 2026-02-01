import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
    selector: 'app-landing',
    imports: [CommonModule],
    templateUrl: './landing.html',
    styleUrl: './landing.css',
})
export class Landing {
    constructor(private router: Router) {}

    navigateToSamlConfig(): void {
        this.router.navigate(['/saml/config']);
    }

    navigateToOidcConfig(): void {
        this.router.navigate(['/oidc/config']);
    }
}
