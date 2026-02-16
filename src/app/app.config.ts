import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { provideStore } from '@ngrx/store';
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { credentialsInterceptor } from './core/interceptors/credentials.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';

export const appConfig: ApplicationConfig = {
    providers: [
        provideBrowserGlobalErrorListeners(),
        provideRouter(routes),
        provideStore(),
        provideAnimations(),
        provideHttpClient(
            withInterceptors([authInterceptor, credentialsInterceptor, errorInterceptor])
        ),
    ],
};
