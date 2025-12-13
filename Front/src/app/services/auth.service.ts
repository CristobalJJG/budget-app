import { Injectable } from '@angular/core';
import axios from 'axios';
import { BehaviorSubject, Observable } from 'rxjs';
import { LocalStorageService } from './local-storage.service';
import { BASE_API_URL } from '../constants/api';
import { TRANSACTIONS_KEY, CATEGORIES_KEY } from '../constants/keys';

export interface User {
    id: number;
    username: string;
    email: string;
    theme?: string;
}

export interface AuthResponse {
    token: string;
    message?: string;
    user?: User;
}

export interface RegisterResponse {
    message: string;
    user: User;
}

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    private currentUserSubject = new BehaviorSubject<User | null>(null);
    public currentUser$: Observable<User | null> = this.currentUserSubject.asObservable();

    private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
    public isAuthenticated$: Observable<boolean> = this.isAuthenticatedSubject.asObservable();

    constructor(private localStorageService: LocalStorageService) {
        // Inicializar el estado después de que el servicio esté disponible
        this.initializeAuthState();
    }

    private initializeAuthState(): void {
        const user = this.localStorageService.getItem<User>('user');
        const token = this.localStorageService.getItem<string>('token');

        this.currentUserSubject.next(user);
        this.isAuthenticatedSubject.next(!!token);
        // If a user has a preferred theme, use it. If there's no user logged in, default to dark theme.
        if (user?.theme) {
            this.applyTheme(user.theme);
        } else if (!user) {
            this.applyTheme('dark');
        }
    }

    private getUserFromStorage(): User | null {
        return this.localStorageService.getItem<User>('user');
    }

    private hasToken(): boolean {
        return !!this.localStorageService.getItem<string>('token');
    }

    async register(username: string, email: string, password: string): Promise<{ success: boolean; error?: string }> {
        try {
            const response = await axios.post<RegisterResponse>(
                `${BASE_API_URL}/auth/register`,
                { username, email, password }
            );
            return { success: !!response.data.user };
        } catch (error: any) {
            const errorMessage = error.response?.data?.error || 'Error al registrar';
            console.error('Error al registrar:', error);
            return { success: false, error: errorMessage };
        }
    }

    async login(email: string, password: string): Promise<{ success: boolean; error?: string }> {
        try {
            const response = await axios.post<AuthResponse>(
                `${BASE_API_URL}/auth/login`,
                { email, password }
            );

            const token = response.data.token;
            const decoded = this.parseJwt(token);
            const userFromResponse = response.data.user;
            const user: User = {
                id: decoded?.id ?? userFromResponse?.id,
                username: decoded?.username ?? userFromResponse?.username,
                email: decoded?.email ?? userFromResponse?.email,
                theme: decoded?.theme ?? userFromResponse?.theme ?? 'light',
            };

            this.localStorageService.setItem('token', token);
            this.localStorageService.setItem('user', user);

            this.currentUserSubject.next(user);
            this.isAuthenticatedSubject.next(true);
            this.applyTheme(user.theme || 'light');

            return { success: true };
        } catch (error: any) {
            const errorMessage = error.response?.data?.error || 'Error al iniciar sesión';
            console.error('Error al iniciar sesión:', error);
            return { success: false, error: errorMessage };
        }
    }

    async updateTheme(theme: string): Promise<{ success: boolean; error?: string }> {
        try {
            const token = this.localStorageService.getItem<string>('token');
            const response = await axios.put<AuthResponse>(
                `${BASE_API_URL}/auth/theme`,
                { theme },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const newToken = response.data.token || token;
            const updatedUser = response.data.user || this.currentUserSubject.value;

            if (newToken) {
                this.localStorageService.setItem('token', newToken);
            }

            if (updatedUser) {
                const userWithTheme = { ...updatedUser, theme };
                this.localStorageService.setItem('user', userWithTheme);
                this.currentUserSubject.next(userWithTheme);
                this.applyTheme(theme);
            }

            return { success: true };
        } catch (error: any) {
            const errorMessage = error.response?.data?.error || 'Error al actualizar el tema';
            console.error('Error al actualizar el tema:', error);
            return { success: false, error: errorMessage };
        }
    }

    logout(): void {
        // Limpiar datos de autenticación
        this.localStorageService.removeItem('token');
        this.localStorageService.removeItem('user');

        // Limpiar datos específicos del usuario
        this.localStorageService.removeItem(TRANSACTIONS_KEY);
        this.localStorageService.removeItem(CATEGORIES_KEY);

        // Limpiar estado de login
        this.localStorageService.removeItem('isLogin');

        // Actualizar observables
        this.currentUserSubject.next(null);
        this.isAuthenticatedSubject.next(false);
        // Ensure UI defaults to dark theme when no user is logged in
        this.applyTheme('dark');
    }

    isAuthenticated(): boolean {
        return this.hasToken();
    }

    getCurrentUser(): User | null {
        return this.currentUserSubject.value;
    }

    applyTheme(theme: string): void {
        if (typeof document !== 'undefined') {
            document.documentElement.setAttribute('data-theme', theme);
        }
    }

    isTokenExpired(): boolean {
        const token = this.localStorageService.getItem<string>('token');
        if (!token) return true;

        try {
            const decoded = this.parseJwt(token);
            if (!decoded || !decoded.exp) return true;

            // exp está en segundos, Date.now() está en milisegundos
            const expirationTime = decoded.exp * 1000;
            const currentTime = Date.now();

            return currentTime >= expirationTime;
        } catch (error) {
            console.error('Error al verificar expiración del token:', error);
            return true;
        }
    }

    private parseJwt(token: string): any {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(
                atob(base64).split('').map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
            );
            return JSON.parse(jsonPayload);
        } catch (error) {
            console.error('Error al parsear JWT:', error);
            return null;
        }
    }
}
