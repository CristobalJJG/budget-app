// src/app/pages/config/config.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormBuilder, ReactiveFormsModule, FormGroup, Validators } from '@angular/forms';
import { ConfigService, AppConfig } from '../../services/config.service';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { CategoriesService, Category } from '../../services/categories.service';
import { TransactionsService } from '../../services/transactions.service';
import { AuthService } from '../../services/auth.service';
import { ThemeSelectorComponent } from '../../components/theme-selector/theme-selector.component';
import { ColorPickerComponent } from '../../components/color-picker/color-picker.component';

@Component({
  selector: 'app-config',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslatePipe, ThemeSelectorComponent, ColorPickerComponent],
  templateUrl: './config.component.html',
  styles: []
})
export class ConfigComponent {
  config: AppConfig;

  categories: Category[] = [];
  categoryForm!: FormGroup;
  editingCategoryId: number | null = null;
  editCategoryForm!: FormGroup;

  theme: string = 'light';
  themeColorOptions = [
    { key: 'primary', value: 'oklch(var(--p))', content: 'oklch(var(--pc))' },
    { key: 'secondary', value: 'oklch(var(--s))', content: 'oklch(var(--sc))' },
    { key: 'accent', value: 'oklch(var(--a))', content: 'oklch(var(--ac))' },
    { key: 'info', value: 'oklch(var(--in))', content: 'oklch(var(--inc))' },
    { key: 'success', value: 'oklch(var(--su))', content: 'oklch(var(--suc))' },
    { key: 'warning', value: 'oklch(var(--wa))', content: 'oklch(var(--wac))' },
    { key: 'error', value: 'oklch(var(--er))', content: 'oklch(var(--erc))' },
    { key: 'neutral', value: 'oklch(var(--n))', content: 'oklch(var(--nc))' },
  ];

  // Colores DaisyUI principales (etiquetas en español -> clave)
  allowedColors = [
    { label: 'Primario', key: 'primary' },
    { label: 'Secundario', key: 'secondary' },
    { label: 'Acento', key: 'accent' },
    { label: 'Informacion', key: 'info' },
    { label: 'Exito', key: 'success' },
    { label: 'Advertencia', key: 'warning' },
    { label: 'Error', key: 'error' },
  ];

  // Import Excel
  selectedFile: File | null = null;
  isImporting = false;
  importResult: { success: boolean; message?: string; results?: any; error?: string } | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly categoriesService: CategoriesService,
    private readonly transactionsService: TransactionsService,
    private readonly fb: FormBuilder,
    private readonly authService: AuthService,
  ) {
    this.config = this.configService.getConfig();
  }

  ngOnInit(): void {
    this.loadCategories();
    this.categoryForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      color: [this.allowedColors[0].label, [Validators.required]]
    });
    this.editCategoryForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      color: [this.allowedColors[0].label, [Validators.required]]
    });

    const user = this.authService.getCurrentUser();
    this.theme = (user?.theme as string) || 'dark';
  }

  async loadCategories(): Promise<void> {
    this.categories = await this.categoriesService.getCategories();
  }

  async createCategory(): Promise<void> {
    if (!this.categoryForm.valid) return;
    const value = this.categoryForm.value;
    const created = await this.categoriesService.createCategory({ name: value.name, color: value.color });
    if (created) {
      this.categoryForm.reset({ name: '', color: this.allowedColors[0].label });
      await this.loadCategories();
    }
  }

  async deleteCategory(id: number): Promise<void> {
    await this.categoriesService.deleteCategory(id);
    await this.loadCategories();
  }

  startEditing(category: Category): void {
    this.editingCategoryId = category.id;
    this.editCategoryForm.patchValue({
      name: category.name,
      color: category.color || this.allowedColors[0].label
    });
  }

  cancelEditing(): void {
    this.editingCategoryId = null;
    this.editCategoryForm.reset();
  }

  async saveCategory(categoryId: number): Promise<void> {
    if (!this.editCategoryForm.valid) return;

    const value = this.editCategoryForm.value;
    const updated = await this.categoriesService.updateCategory(categoryId, {
      name: value.name,
      color: value.color
    });

    if (updated) {
      this.editingCategoryId = null;
      this.editCategoryForm.reset();
      await this.loadCategories();
    }
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

  isHex(value: string | undefined | null): boolean {
    if (!value) return false;
    return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(value);
  }

  // Helper seguro para la plantilla: devuelve color de contraste o null
  getContrastColorMaybe(color?: string | null): string | null {
    if (!color) return null;
    return this.isHex(color) ? this.getContrastColor(color) : null;
  }

  async updateTheme(theme?: string): Promise<void> {
    const nextTheme = theme || this.theme || 'dark';
    this.theme = nextTheme;
    this.authService.applyTheme(nextTheme);
    await this.authService.updateTheme(nextTheme);
  }

  async onThemeChange(theme: string): Promise<void> {
    await this.updateTheme(theme);
  }

  /**
   * Devuelve el color de texto asociado al token del tema.
   * Si el color es un hex, calcula el contraste.
   */
  getContrastColor(color: string): string {
    if (!color) return '#000000';

    const mapped = this.mapThemeContentColor(color);
    if (mapped) return mapped;

    if (color.startsWith('#') && (color.length === 7 || color.length === 4)) {
      return this.getHexContrast(color);
    }

    // Fallback: texto negro
    return '#000000';
  }

  private getHexContrast(hexColor: string): string {
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance < 0.5 ? '#ffffff' : '#000000';
  }

  private mapThemeContentColor(color: string): string | null {
    const normalized = color.toLowerCase();
    if (normalized.includes('var(--p')) return 'oklch(var(--pc))';
    if (normalized.includes('var(--s')) return 'oklch(var(--sc))';
    if (normalized.includes('var(--a')) return 'oklch(var(--ac))';
    if (normalized.includes('var(--in')) return 'oklch(var(--inc))';
    if (normalized.includes('var(--su')) return 'oklch(var(--suc))';
    if (normalized.includes('var(--wa')) return 'oklch(var(--wac))';
    if (normalized.includes('var(--er')) return 'oklch(var(--erc))';
    if (normalized.includes('var(--n')) return 'oklch(var(--nc))';
    return null;
  }

  saveConfig() {
    this.configService.updateConfig(this.config);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      // Validar que sea un archivo Excel
      const validExtensions = ['.xlsx', '.xls'];
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));

      if (!validExtensions.includes(fileExtension)) {
        this.importResult = {
          success: false,
          error: 'Por favor, selecciona un archivo Excel (.xlsx o .xls)',
        };
        input.value = '';
        return;
      }

      this.selectedFile = file;
      this.importResult = null;
    }
  }

  async importExcel(): Promise<void> {
    if (!this.selectedFile) {
      this.importResult = {
        success: false,
        error: 'Por favor, selecciona un archivo',
      };
      return;
    }

    this.isImporting = true;
    this.importResult = null;

    try {
      const result = await this.transactionsService.importTransactions(this.selectedFile);
      this.importResult = result;

      if (result.success) {
        // Limpiar el archivo seleccionado después de una importación exitosa
        this.selectedFile = null;
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        if (fileInput) {
          fileInput.value = '';
        }
      }
    } catch (error) {
      this.importResult = {
        success: false,
        error: 'Error inesperado al importar el archivo',
      };
    } finally {
      this.isImporting = false;
    }
  }
}