import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type AlertType = 'success' | 'error' | 'info' | 'warning';

export interface Alert {
    id: string;
    type: AlertType;
    message: string;
    timeout?: number; // ms, optional auto-dismiss
}

@Injectable({ providedIn: 'root' })
export class AlertService {
    private alertsSubject = new BehaviorSubject<Alert[]>([]);
    public alerts$ = this.alertsSubject.asObservable();

    private nextId() { return Math.random().toString(36).slice(2, 9); }

    show(type: AlertType, message: string, timeout = 5000) {
        const id = this.nextId();
        const alert: Alert = { id, type, message, timeout };
        const current = this.alertsSubject.value.slice();
        current.push(alert);
        this.alertsSubject.next(current);

        if (timeout && timeout > 0) {
            setTimeout(() => this.close(id), timeout);
        }
        return id;
    }

    success(message: string, timeout = 4000) { return this.show('success', message, timeout); }
    error(message: string, timeout = 8000) { return this.show('error', message, timeout); }
    info(message: string, timeout = 4000) { return this.show('info', message, timeout); }
    warning(message: string, timeout = 6000) { return this.show('warning', message, timeout); }

    close(id: string) {
        const current = this.alertsSubject.value.slice().filter(a => a.id !== id);
        this.alertsSubject.next(current);
    }

    clear() { this.alertsSubject.next([]); }
}
