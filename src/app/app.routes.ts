import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';

export const routes: Routes = [
    {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full',
    },
    {
        path: 'landing',
        loadComponent: () => import('./features/landing/landing').then((m) => m.Landing),
    },
    {
        path: 'login',
        canActivate: [guestGuard],
        loadComponent: () =>
            import('./features/auth/login/login.component').then((m) => m.LoginComponent),
    },
    {
        path: 'signup',
        canActivate: [guestGuard],
        loadComponent: () =>
            import('./features/auth/signup/signup.component').then((m) => m.SignupComponent),
    },
    {
        path: 'dashboard',
        canActivate: [authGuard],
        loadComponent: () =>
            import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
    },
    {
        path: 'saml',
        canActivate: [authGuard],
        children: [
            {
                path: '',
                loadComponent: () =>
                    import('./features/saml/saml-config/saml-config').then((m) => m.SamlConfig),
            },
            {
                path: 'callback',
                loadComponent: () =>
                    import('./features/saml/saml-callback/saml-callback').then(
                        (m) => m.SamlCallback
                    ),
            },
        ],
    },
    {
        path: 'oidc',
        canActivate: [authGuard],
        children: [
            {
                path: '',
                loadComponent: () =>
                    import('./features/oidc/oidc-config/oidc-config').then((m) => m.OidcConfig),
            },
            {
                path: 'callback',
                loadComponent: () =>
                    import('./features/oidc/oidc-callback/oidc-callback').then(
                        (m) => m.OidcCallback
                    ),
            },
        ],
    },
    {
        path: '**',
        redirectTo: '',
    },
];
