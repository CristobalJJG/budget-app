import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
    providedIn: 'root'
})
export class LocalStorageService {

    constructor(@Inject(PLATFORM_ID) private platformId: Object) { }

    private isLocalStorageAvailable(): boolean {
        return isPlatformBrowser(this.platformId) && typeof localStorage !== 'undefined';
    }

    /**
     * Guarda o actualiza un valor en localStorage.
     * @param key La clave bajo la cual se guardará el valor.
     * @param value El valor a guardar. Se convertirá a formato JSON.
     */
    setItem(key: string, value: any): void {
        try {
            if (!this.isLocalStorageAvailable()) return;
            const serializedValue = JSON.stringify(value);
            localStorage.setItem(key, serializedValue);
        } catch (e) {
            console.error('Error al guardar en localStorage', e);
        }
    }

    /**
     * Obtiene un valor de localStorage.
     * @param key La clave del valor a obtener.
     * @returns El valor recuperado y parseado, o null si no existe o hay un error.
     */
    getItem<T>(key: string): T | null {
        try {
            if (!this.isLocalStorageAvailable()) return null;
            const serializedValue = localStorage.getItem(key);
            if (serializedValue === null) return null;
            return JSON.parse(serializedValue) as T;
        } catch (e) {
            console.error('Error al leer de localStorage', e);
            return null;
        }
    }

    /**
     * Elimina un valor de localStorage.
     * @param key La clave del valor a eliminar.
     */
    removeItem(key: string): void {
        try {
            if (!this.isLocalStorageAvailable()) return;
            localStorage.removeItem(key);
        } catch (e) {
            console.error('Error al eliminar de localStorage', e);
        }
    }

    /**
     * Limpia todo el contenido de localStorage.
     */
    clear(): void {
        try {
            if (!this.isLocalStorageAvailable()) return;
            localStorage.clear();
        } catch (e) {
            console.error('Error al limpiar localStorage', e);
        }
    }
}