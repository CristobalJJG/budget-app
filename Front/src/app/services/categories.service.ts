import { Injectable } from '@angular/core';
import axios from 'axios';
import { LocalStorageService } from './local-storage.service';
import { CATEGORIES_API } from '../constants/api';
import { CATEGORIES_KEY } from '../constants/keys';

export interface Category {
    id: number;
    name: string;
    user_id?: number;
    color?: string;
}

@Injectable({
    providedIn: 'root',
})
export class CategoriesService {
    constructor(
        private localStorageService: LocalStorageService
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
    async getCategories(): Promise<Category[]> {
        try {
            const response = await axios.get<Category[]>(CATEGORIES_API);
            const categories = response.data;
            this.localStorageService.setItem(CATEGORIES_KEY, categories);
            return categories;
        } catch (error) {
            console.error('Error al obtener categorías con axios:', error);
            return [];
        }
    }

    // READ (Una)
    async getCategory(id: number): Promise<Category | null> {
        try {
            const response = await axios.get<Category>(`${CATEGORIES_API}/${id}`);
            return response.data;
        } catch (error) {
            console.error(`Error al obtener la categoría ${id}:`, error);
            return null;
        }
    }

    // CREATE
    async createCategory(category: Omit<Category, 'id'>): Promise<Category | null> {
        try {
            const response = await axios.post<Category>(CATEGORIES_API, category);
            return response.data;
        } catch (error) {
            console.error('Error al crear la categoría con axios:', error);
            return null;
        }
    }

    // UPDATE
    async updateCategory(id: number, category: Partial<Category>): Promise<Category | null> {
        try {
            const response = await axios.put<Category>(`${CATEGORIES_API}/${id}`, category);
            return response.data;
        } catch (error) {
            console.error(`Error al actualizar la categoría ${id}:`, error);
            return null;
        }
    }

    // DELETE
    async deleteCategory(id: number): Promise<void> {
        try {
            await axios.delete(`${CATEGORIES_API}/${id}`);
        } catch (error) {
            console.error(`Error al eliminar la categoría ${id}:`, error);
        }
    }
}