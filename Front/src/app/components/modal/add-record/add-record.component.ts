import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslatePipe } from '../../../pipes/translate.pipe';
import { LocalStorageService } from '../../../services/local-storage.service';
import { TransactionsService } from '../../../services/transactions.service';

export interface Category {
  id: string | number;
  name: string;
}

@Component({
  selector: 'app-add-record',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslatePipe],
  templateUrl: './add-record.component.html'
})
export class AddRecordComponent implements OnInit {
  form!: FormGroup;
  categories: Category[] = [];

  constructor(
    private fb: FormBuilder,
    private localStorageService: LocalStorageService,
    private transactionService: TransactionsService
  ) { }

  ngOnInit(): void {
    this.loadCategories();
    this.initializeForm();
  }

  loadCategories(): void {
    const savedCategories = this.localStorageService.getItem<Category[]>('categories');
    this.categories = savedCategories && Array.isArray(savedCategories) ? savedCategories : [];
  }

  initializeForm(): void {
    this.form = this.fb.group({
      date: [new Date().toISOString().split('T')[0], Validators.required],
      name: ['', [Validators.required, Validators.minLength(3)]],
      amount: [0, [Validators.required, Validators.pattern(/^-?\d+(\.\d{1,2})?$/)]],
      category_id: ['', Validators.required],
      description: ['']
    });
  }

  get isFormValid(): boolean {
    return this.form.valid;
  }

  async onSubmit(): Promise<void> {
    if (this.form.valid) {
      const formData = this.form.value;

      // Convertir category_id a número
      const transactionData = {
        date: formData.date,
        name: formData.name,
        amount: parseFloat(formData.amount),
        category_id: parseInt(formData.category_id, 10),
        description: formData.description || ''
      };

      console.log('Enviando:', transactionData);

      const transaction = await this.transactionService.createTransaction(transactionData);
      if (transaction) {
        console.log('Transacción creada:', transaction);
        this.onReset();
        window.location.reload();
      } else console.error('Error al crear la transacción');
    }
  }

  onReset(): void {
    this.form.reset({
      date: new Date().toISOString().split('T')[0]
    });
  }
}
