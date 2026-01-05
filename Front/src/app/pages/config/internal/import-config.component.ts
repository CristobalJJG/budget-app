import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TransactionsService } from '../../../services/transactions.service';
import { TranslatePipe } from '../../../pipes/translate.pipe';

@Component({
    selector: 'app-import-config',
    standalone: true,
    imports: [CommonModule, FormsModule, TranslatePipe],
    template: `
  <div class="p-2">
    <div class="flex items-center justify-between">
      <h2 class="text-xl font-semibold">{{ 'config.importExcel' | translate }}</h2>
      <button class="btn btn-ghost btn-sm md:hidden" (click)="toggle()" aria-label="Toggle import">
        <svg *ngIf="!collapsed" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"/></svg>
        <svg *ngIf="collapsed" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
      </button>
    </div>

    <div [class.hidden]="collapsed" class="mt-3">
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium mb-2">{{ 'config.selectFile' | translate }}</label>
          <input type="file" accept=".xlsx,.xls" (change)="onFileSelected($event)"
            class="file-input file-input-bordered w-full" [disabled]="isImporting" />
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-2">{{ 'config.fileFormat' | translate }}</p>
        </div>

        <div *ngIf="selectedFile" class="p-3 bg-base-200 rounded">
          <p class="text-sm"><strong>{{ 'config.selectedFile' | translate }}:</strong> {{ selectedFile.name }}</p>
        </div>

        <button (click)="importExcel()" class="btn btn-primary" [disabled]="!selectedFile || isImporting">
          <span *ngIf="!isImporting">{{ 'config.import' | translate }}</span>
          <span *ngIf="isImporting">{{ 'config.importing' | translate }}...</span>
        </button>

        <div *ngIf="importResult" class="mt-4">
          <div *ngIf="importResult.success" class="alert alert-success">
            <div>
              <strong>{{ 'config.importSuccess' | translate }}</strong>
              <div *ngIf="importResult.results" class="mt-2 text-sm">
                <p>{{ 'config.successCount' | translate }}: {{ importResult.results.success }}</p>
                <p *ngIf="importResult.results.failed > 0" class="text-error">{{ 'config.failedCount' | translate }}: {{ importResult.results.failed }}</p>
              </div>
            </div>
          </div>
          <div *ngIf="!importResult.success" class="alert alert-error">
            <div>
              <strong>{{ 'config.importError' | translate }}</strong>
              <p>{{ importResult.error }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  `
})
export class ImportConfigComponent {
    collapsed = false;
    selectedFile: File | null = null;
    isImporting = false;
    importResult: any = null;

    constructor(private transactionsService: TransactionsService) { }

    onFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            const file = input.files[0];
            const validExtensions = ['.xlsx', '.xls'];
            const ext = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
            if (!validExtensions.includes(ext)) {
                this.importResult = { success: false, error: 'Por favor, selecciona un archivo Excel (.xlsx o .xls)' };
                input.value = '';
                return;
            }
            this.selectedFile = file;
            this.importResult = null;
        }
    }

    async importExcel(): Promise<void> {
        if (!this.selectedFile) return;
        this.isImporting = true;
        this.importResult = null;
        try {
            const result = await this.transactionsService.importTransactions(this.selectedFile);
            this.importResult = result;
            if (result.success) {
                this.selectedFile = null;
            }
        } catch (e) {
            this.importResult = { success: false, error: 'Error inesperado al importar el archivo' };
        } finally {
            this.isImporting = false;
        }
    }

    toggle() {
        this.collapsed = !this.collapsed;
    }
}
