import { Injectable } from '@angular/core';
import axios from 'axios';
import { LocalStorageService } from './local-storage.service';
import { SERVICES_API } from '../constants/api';

export interface ServiceItem {
    id: number;
    name: string;
    user_id?: number;
}

export interface ServiceRecord {
    id: number;
    service_id: number;
    user_id?: number;
    year: number;
    month: number;
    amount: number;
}

@Injectable({ providedIn: 'root' })
export class ServicesService {
    constructor(private localStorageService: LocalStorageService) {
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

    async getServices(): Promise<ServiceItem[]> {
        try {
            const response = await axios.get<ServiceItem[]>(SERVICES_API);
            return response.data;
        } catch (error) {
            console.error('Error fetching services:', error);
            return [];
        }
    }

    async createService(payload: { name: string }): Promise<ServiceItem | null> {
        try {
            const response = await axios.post<ServiceItem>(SERVICES_API, payload);
            return response.data;
        } catch (error) {
            console.error('Error creating service:', error);
            // rethrow so callers can surface API errors
            throw error;
        }
    }

    async updateService(id: number, payload: Partial<ServiceItem>): Promise<ServiceItem | null> {
        try {
            const response = await axios.put<ServiceItem>(`${SERVICES_API}/${id}`, payload);
            return response.data;
        } catch (error) {
            console.error('Error updating service:', error);
            return null;
        }
    }

    async deleteService(id: number): Promise<void> {
        try {
            await axios.delete(`${SERVICES_API}/${id}`);
        } catch (error) {
            console.error('Error deleting service:', error);
        }
    }

    // Records
    async getRecords(year?: number, month?: number): Promise<ServiceRecord[]> {
        try {
            const params: any = {};
            if (year) params.year = year;
            if (month) params.month = month;
            const response = await axios.get<ServiceRecord[]>(`${SERVICES_API}/records`, { params });
            return response.data;
        } catch (error) {
            console.error('Error fetching service records:', error);
            return [];
        }
    }

    async createRecord(payload: { service_id: number; year: number; month: number; amount: number }): Promise<ServiceRecord | null> {
        try {
            const response = await axios.post<ServiceRecord>(`${SERVICES_API}/records`, payload);
            return response.data;
        } catch (error) {
            console.error('Error creating service record:', error);
            return null;
        }
    }

    async updateRecord(id: number, payload: Partial<ServiceRecord>): Promise<ServiceRecord | null> {
        try {
            const response = await axios.put<ServiceRecord>(`${SERVICES_API}/records/${id}`, payload);
            return response.data;
        } catch (error) {
            console.error('Error updating service record:', error);
            return null;
        }
    }

    async deleteRecord(id: number): Promise<void> {
        try {
            await axios.delete(`${SERVICES_API}/records/${id}`);
        } catch (error) {
            console.error('Error deleting service record:', error);
        }
    }
}
