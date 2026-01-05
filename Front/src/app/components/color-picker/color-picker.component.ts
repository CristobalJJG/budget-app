import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface PickerColor {
    label: string; // 'Primario'
    key: string;   // 'primary'
}

@Component({
    selector: 'app-color-picker',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './color-picker.component.html',
    styleUrls: ['./color-picker.component.scss']
})
export class ColorPickerComponent {
    @Input() colors: PickerColor[] = [
        { label: 'Primario', key: 'primary' },
        { label: 'Secundario', key: 'secondary' },
        { label: 'Acento', key: 'accent' },
        { label: 'Informacion', key: 'info' },
        { label: 'Exito', key: 'success' },
        { label: 'Advertencia', key: 'warning' },
        { label: 'Error', key: 'error' }
    ];

    // Selected value is the Spanish label (e.g. 'Primario') to stay consistent with UI
    @Input() value?: string | null;
    @Output() valueChange = new EventEmitter<string>();

    trackByLabel(_: number, item: PickerColor) {
        return item.label;
    }

    select(label: string) {
        this.value = label;
        this.valueChange.emit(label);
    }

    isSelected(label: string) {
        return this.value === label;
    }

    // Helper used by the dropdown preview: map the stored label to the DaisyUI key
    getKeyForLabel(label?: string | null): string | undefined {
        if (!label) return undefined;
        const match = this.colors.find(c => c.label === label);
        return match ? match.key : undefined;
    }

    onSelect(eventOrLabel: Event | string) {
        let label: string | null = null;
        if (typeof eventOrLabel === 'string') {
            label = eventOrLabel || null;
        } else {
            const target = eventOrLabel.target as HTMLSelectElement | null;
            label = target ? (target.value || null) : null;
        }

        // empty / null means no selection
        if (!label) {
            this.value = null;
            this.valueChange.emit('');
            return;
        }

        this.select(label);
    }
}
