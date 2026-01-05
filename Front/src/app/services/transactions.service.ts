import { Injectable } from '@angular/core';
import axios from 'axios';
import { LocalStorageService } from './local-storage.service';
import { AuthService } from './auth.service';
import { TRANSACTIONS_API } from '../constants/api';
import { TRANSACTIONS_KEY } from '../constants/keys';

export interface Transaction {
    id: number;
    date: string;
    name: string;
    amount: number;
    category_id: number;
    description?: string;
    balance_after?: number;
    user_id?: number;
}

@Injectable({
    providedIn: 'root',
})
export class TransactionsService {
    constructor(
        private localStorageService: LocalStorageService,
        private authService: AuthService
    ) {
        this.setupAxiosInterceptor();
    }

    private setupAxiosInterceptor(): void {
        axios.interceptors.request.use((config) => {
            const token = this.localStorageService.getItem<string>('token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        });
    }

    // READ (Todas)
    async getTransactions(): Promise<Transaction[]> {
        try {
            const response = await axios.get<Transaction[]>(TRANSACTIONS_API);
            const transactions = response.data;
            this.localStorageService.setItem(TRANSACTIONS_KEY, transactions);
            return transactions;
        } catch (error) {
            console.error('Error al obtener transacciones con axios:', error);
            return [];
        }
    }

    // READ (Una)
    async getTransaction(id: number): Promise<Transaction | null> {
        try {
            const response = await axios.get<Transaction>(`${TRANSACTIONS_API}/${id}`);
            return response.data;
        } catch (error) {
            console.error(`Error al obtener la transacción ${id}:`, error);
            return null;
        }
    }

    // CREATE
    async createTransaction(transaction: Omit<Transaction, 'id'>): Promise<Transaction | null> {
        try {
            const response = await axios.post<Transaction>(TRANSACTIONS_API, transaction);
            return response.data;
        } catch (error) {
            console.error('Error al crear la transacción con axios:', error);
            return null;
        }
    }

    // UPDATE
    async updateTransaction(id: number, transaction: Partial<Transaction>): Promise<Transaction | null> {
        try {
            const response = await axios.put<Transaction>(`${TRANSACTIONS_API}/${id}`, transaction);
            
            // Después de actualizar, recargar todas las transacciones desde el servidor
            // porque el backend puede haber recalculado múltiples registros
            console.log('🔄 Recargando todas las transacciones después de actualizar...');
            await this.getTransactions();
            
            return response.data;
        } catch (error: any) {
            console.error(`Error al actualizar la transacción ${id}:`, error);
            if (error.response) {
                console.error('Error response:', error.response.data);
                console.error('Error status:', error.response.status);
            }
            return null;
        }
    }

    // DELETE
    async deleteTransaction(id: number): Promise<void> {
        try {
            await axios.delete(`${TRANSACTIONS_API}/${id}`);
        } catch (error) {
            console.error(`Error al eliminar la transacción ${id}:`, error);
        }
    }

    // IMPORT from Excel
    async importTransactions(file: File): Promise<{ success: boolean; message?: string; results?: any; error?: string }> {
        try {
            // Verificar que el token existe antes de hacer la petición
            const token = this.localStorageService.getItem<string>('token');
            if (!token) {
                return {
                    success: false,
                    error: 'No hay sesión activa. Por favor, inicia sesión nuevamente.',
                };
            }

            // Verificar si el token está expirado
            if (this.authService.isTokenExpired()) {
                // Limpiar el token expirado
                this.localStorageService.removeItem('token');
                this.localStorageService.removeItem('user');
                return {
                    success: false,
                    error: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
                };
            }

            const formData = new FormData();
            formData.append('file', file);

            // Agregar el token explícitamente en los headers para asegurar que se envíe
            // incluso cuando axios maneja FormData automáticamente
            const response = await axios.post(`${TRANSACTIONS_API}/import`, formData, {
                headers: { Authorization: `Bearer ${token}`,},
            });

            return {
                success: true,
                message: response.data.message,
                results: response.data.results,
            };
        } catch (error: any) {
            console.error('Error al importar transacciones:', error);

            // Manejo específico de errores de autenticación
            if (error.response?.status === 401) {
                const errorMessage = error.response?.data?.error || 'Token inválido o expirado';

                // Limpiar el token si hay error de autenticación
                this.localStorageService.removeItem('token');
                this.localStorageService.removeItem('user');

                return {
                    success: false,
                    error: 'Sesión expirada o inválida. Por favor, inicia sesión nuevamente.',
                };
            }

            const errorMessage = error.response?.data?.error || 'Error al importar transacciones';
            return {
                success: false,
                error: errorMessage,
            };
        }
    }
}