import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormsModule } from '@angular/forms';
import { CategoriesService, Category } from '../../../services/categories.service';
import { ColorPickerComponent } from '../../../components/color-picker/color-picker.component';
import { TranslatePipe } from '../../../pipes/translate.pipe';

@Component({
    selector: 'app-categories-config',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, FormsModule, ColorPickerComponent, TranslatePipe],
    template: `
  <div class="p-2">
    <h2 class="text-xl font-semibold mb-4">{{ 'categories.title' | translate }}</h2>

    <form [formGroup]="categoryForm" class="flex flex-col md:flex-row items-stretch md:items-center gap-3 w-full" (ngSubmit)="createCategory()">
      <div class="flex-shrink-0">
        <app-color-picker [colors]="allowedColors" [value]="categoryForm.get('color')?.value" (valueChange)="categoryForm.patchValue({ color: $event })"></app-color-picker>
      </div>

      <div class="flex-1 w-full">
        <input formControlName="name" class="input input-bordered w-full truncate" [placeholder]="'categories.name' | translate" />
      </div>

      <div class="w-full md:w-auto">
        <button type="submit" class="btn btn-primary w-full md:w-auto" [disabled]="!categoryForm.valid">{{ 'categories.add' | translate }}</button>
      </div>
    </form>

    <ul class="space-y-3 mt-6">
      <li *ngFor="let c of categories" class="flex items-center justify-between p-4 bg-base-100 border border-base-300 rounded-lg">
        <div class="flex items-center gap-3">
          <div class="px-4 py-2 rounded-lg font-medium" [ngClass]="!isHex(c.color) ? getBgClass(c.color+'') : ''" [style.background]="isHex(c.color) ? c.color : null" [style.color]="getContrastColorMaybe(c.color)">{{ c.name }}</div>
        </div>
        <div class="flex gap-2">
          <button class="btn btn-md btn-primary" (click)="startEditing(c)">{{ 'categories.edit' | translate }}</button>
          <button class="btn btn-md btn-error" (click)="deleteCategory(c.id)">{{ 'categories.delete' | translate }}</button>
        </div>
      </li>
    </ul>
  </div>
  `
})
export class CategoriesConfigComponent {
    categories: Category[] = [];
    allowedColors = [
        { label: 'Primario', key: 'primary' },
        { label: 'Secundario', key: 'secondary' },
        { label: 'Acento', key: 'accent' },
        { label: 'Informacion', key: 'info' },
        { label: 'Exito', key: 'success' },
        { label: 'Advertencia', key: 'warning' },
        { label: 'Error', key: 'error' },
    ];

    categoryForm = this.fb.group({ name: [''], color: [this.allowedColors[0].label] });

    constructor(private categoriesService: CategoriesService, private fb: FormBuilder) {
        this.load();
    }

    async load() {
        this.categories = await this.categoriesService.getCategories();
    }

    async createCategory() {
        if (!this.categoryForm.valid) return;
        const value = this.categoryForm.value;
        await this.categoriesService.createCategory({ name: value.name, color: value.color });
        this.categoryForm.reset({ name: '', color: this.allowedColors[0].label });
        await this.load();
    }

    async deleteCategory(id: number) {
        await this.categoriesService.deleteCategory(id);
        await this.load();
    }

    startEditing(c: Category) {
        // simple UX placeholder: populate form for quick edit
        this.categoryForm.patchValue({ name: c.name, color: c.color || this.allowedColors[0].label });
    }

    getBgClass(label: string): string {
        const map: Record<string, string> = {
            'Primario': 'bg-primary text-primary-content',
            'Secundario': 'bg-secondary text-secondary-content',
            'Acento': 'bg-accent text-accent-content',
            'Informacion': 'bg-info text-info-content',
            'Exito': 'bg-success text-success-content',
            'Advertencia': 'bg-warning text-warning-content',
            'Error': 'bg-error text-error-content',
        };
        return map[label] || 'bg-base-200 text-base-content';
    }

    isHex(value?: string | null): boolean {
        if (!value) return false;
        return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(value);
    }

    getContrastColorMaybe(color?: string | null): string | null {
        if (!color) return null;
        if (this.isHex(color)) {
            const hex = color.replace('#', '');
            const r = parseInt(hex.substring(0, 2), 16);
            const g = parseInt(hex.substring(2, 4), 16);
            const b = parseInt(hex.substring(4, 6), 16);
            const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
            return luminance < 0.5 ? '#ffffff' : '#000000';
        }
        return null;
    }
}
