import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        loadComponent: () => import('./features/landing/landing').then((m) => m.Landing),
    },
    {
        path: 'saml',
        children: [
            {
                path: 'config',
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
        children: [
            {
                path: 'config',
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
