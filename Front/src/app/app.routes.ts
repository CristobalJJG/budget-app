import { Routes } from '@angular/router';
import { MonthComponent } from './pages/month/month.component';
import { ConfigComponent } from './pages/config/config.component';
import { ServicesConfigComponent } from './pages/config/internal/services-config.component';
import { GeneralComponent } from './pages/general/general.component';
import { LoginComponent } from './pages/auth/login/login.component';
import { RegisterComponent } from './pages/auth/register/register.component';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
    // Auth routes (públicas)
    { path: 'login', component: LoginComponent },
    { path: 'register', component: RegisterComponent },

    // Protected routes
    { path: 'config', component: ConfigComponent, canActivate: [AuthGuard] },
    { path: 'services', component: ServicesConfigComponent, canActivate: [AuthGuard] },
    { path: 'general', component: GeneralComponent, canActivate: [AuthGuard] },
    { path: 'month', component: MonthComponent, canActivate: [AuthGuard] },

    // Redirect unknown routes to home
    { path: '**', redirectTo: '' }
];
