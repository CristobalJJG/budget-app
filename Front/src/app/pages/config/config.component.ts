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

@Component({
  selector: 'app-config',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslatePipe, ThemeSelectorComponent],
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
      color: ['#cccccc', [Validators.required, Validators.pattern(/^#([0-9A-Fa-f]{6})$/)]]
    });
    this.editCategoryForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      color: ['#cccccc', [Validators.required, Validators.pattern(/^#([0-9A-Fa-f]{6})$/)]]
    });

    const user = this.authService.getCurrentUser();
    this.theme = (user?.theme as string) || 'light';
  }

  async loadCategories(): Promise<void> {
    this.categories = await this.categoriesService.getCategories();
  }

  async createCategory(): Promise<void> {
    if (!this.categoryForm.valid) return;
    const value = this.categoryForm.value;
    const created = await this.categoriesService.createCategory({ name: value.name, color: value.color });
    if (created) {
      this.categoryForm.reset({ name: '', color: '#cccccc' });
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
      color: category.color || '#cccccc'
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

  async updateTheme(theme?: string): Promise<void> {
    const nextTheme = theme || this.theme || 'light';
    this.theme = nextTheme;
    this.authService.applyTheme(nextTheme);
    await this.authService.updateTheme(nextTheme);
  }

  async onThemeChange(theme: string): Promise<void> {
    await this.updateTheme(theme);
  }

  /**
   * Calcula el contraste de luminancia entre un color y el fondo
   * Retorna el color de texto (blanco o negro) según el contraste
   */
  getContrastColor(hexColor: string): string {
    if (!hexColor) return '#000000';

    // Remover el # si existe
    const hex = hexColor.replace('#', '');

    // Convertir a RGB
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    // Calcular luminancia relativa (fórmula WCAG)
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    // Si la luminancia es menor a 0.5, usar texto blanco, sino negro
    return luminance < 0.5 ? '#ffffff' : '#000000';
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