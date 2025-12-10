import { Injectable, TemplateRef } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ModalConfig {
    title: string;
    content?: string;  // Make this optional since we'll use template
    template?: TemplateRef<any>;  // Add template reference for custom HTML
    confirmText?: string;
    cancelText?: string;
    isDanger?: boolean;
    onConfirm?: () => void;
    onCancel?: () => void;
}

@Injectable({
    providedIn: 'root'
})
export class ModalService {
    private readonly modalConfig = new BehaviorSubject<ModalConfig | null>(null);
    public readonly modalConfig$ = this.modalConfig.asObservable();

    private readonly isOpen = new BehaviorSubject<boolean>(false);
    public readonly isOpen$ = this.isOpen.asObservable();

    open(config: ModalConfig): void {
        this.modalConfig.next(config);
        this.isOpen.next(true);
    }

    close(): void {
        this.isOpen.next(false);
        setTimeout(() => this.modalConfig.next(null), 300);
    }

    confirm(): void {
        const config = this.modalConfig.value;
        if (config?.onConfirm) config.onConfirm();
        this.close();
    }

    cancel(): void {
        const config = this.modalConfig.value;
        if (config?.onCancel) config.onCancel();
        this.close();
    }
}
