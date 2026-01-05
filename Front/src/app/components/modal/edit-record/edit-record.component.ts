import { Component, OnInit, OnChanges, Input, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslatePipe } from '../../../pipes/translate.pipe';
import { LocalStorageService } from '../../../services/local-storage.service';
import { TransactionsService, Transaction } from '../../../services/transactions.service';
import { ModalService } from '../../../services/modal.service';

export interface Category {
  id: string | number;
  name: string;
}

@Component({
  selector: 'app-edit-record',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslatePipe],
  templateUrl: './edit-record.component.html'
})
export class EditRecordComponent implements OnInit, OnChanges {
  @Input() transaction!: Transaction | any; // Usar any para permitir propiedades adicionales como Category
  form!: FormGroup;
  categories: Category[] = [];
  isFirstTransaction: boolean = false;
  calculatedBalance: number | null = null;
  formInitialized: boolean = false;

  constructor(
    private fb: FormBuilder,
    private localStorageService: LocalStorageService,
    private transactionService: TransactionsService,
    private modalService: ModalService
  ) {
    // Inicializar formulario vacío para evitar errores
    this.form = this.fb.group({
      date: ['', Validators.required],
      name: ['', [Validators.required, Validators.minLength(3)]],
      amount: [0, [Validators.required, Validators.pattern(/^-?\d+(\.\d{1,2})?$/)]],
      category_id: ['', Validators.required],
      description: [''],
      balance_after: [null]
    });
  }

  ngOnInit(): void {
    this.loadCategories();
    if (this.transaction) {
      this.initializeForm();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['transaction'] && this.transaction) {
      this.initializeForm();
    }
  }

  loadCategories(): void {
    const savedCategories = this.localStorageService.getItem<Category[]>('categories');
    this.categories = savedCategories && Array.isArray(savedCategories) ? savedCategories : [];
  }

  async initializeForm(): Promise<void> {
    // Obtener todas las transacciones ordenadas por fecha
    const allTransactions = await this.transactionService.getTransactions();

    // Ordenar por fecha (ascendente)
    const sortedTransactions = [...allTransactions].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      if (dateA !== dateB) {
        return dateA - dateB;
      }
      // Si tienen la misma fecha, ordenar por id (el último es el más reciente)
      return a.id - b.id;
    });

    // Determinar si es la primera transacción
    this.isFirstTransaction = sortedTransactions.length > 0 && sortedTransactions[0].id === this.transaction.id;

    // Calcular el balance_after si no es la primera transacción
    if (!this.isFirstTransaction) {
      this.calculatedBalance = this.calculateBalanceAfter(sortedTransactions);
    }

    // Obtener el category_id de la transacción
    let categoryId = this.transaction.category_id;

    // Si la transacción tiene Category como objeto, extraer el id
    if (this.transaction['Category'] && this.transaction['Category'].id) {
      categoryId = this.transaction['Category'].id;
    } else if (this.transaction['category'] && this.transaction['category'].id) {
      categoryId = this.transaction['category'].id;
    }

    // Formatear la fecha para el input date (YYYY-MM-DD)
    const dateValue = this.transaction.date ? this.transaction.date.split('T')[0] : new Date().toISOString().split('T')[0];

    // Valor inicial de balance_after - asegurarse de que sea un número válido
    let initialBalance: number | null = null;
    if (this.isFirstTransaction) {
      const balance = this.transaction.balance_after;
      initialBalance = balance !== null && balance !== undefined ? Number(balance) : null;
    } else {
      initialBalance = this.calculatedBalance !== null && !isNaN(this.calculatedBalance) 
        ? Number(this.calculatedBalance.toFixed(2)) 
        : null;
    }

    this.form = this.fb.group({
      date: [dateValue, Validators.required],
      name: [this.transaction.name || '', [Validators.required, Validators.minLength(3)]],
      amount: [Number(this.transaction.amount || 0), [Validators.required, Validators.pattern(/^-?\d+(\.\d{1,2})?$/)]],
      category_id: [categoryId || '', Validators.required],
      description: [this.transaction.description || ''],
      balance_after: [{ value: initialBalance, disabled: !this.isFirstTransaction }]
    });

    // Si no es la primera transacción, deshabilitar el campo
    if (!this.isFirstTransaction) {
      this.form.get('balance_after')?.disable();
    }

    // Marcar formulario como inicializado
    this.formInitialized = true;

    // Suscribirse a cambios en amount y date para recalcular balance
    this.form.get('amount')?.valueChanges.subscribe(async () => {
      if (!this.isFirstTransaction) {
        await this.recalculateBalance();
      }
    });

    this.form.get('date')?.valueChanges.subscribe(async () => {
      if (!this.isFirstTransaction) {
        await this.recalculateBalance();
      }
    });
  }

  calculateBalanceAfter(sortedTransactions: Transaction[]): number | null {
    // Obtener la fecha actual del formulario o de la transacción
    const currentDate = this.form?.get('date')?.value || this.transaction.date;
    const currentDateObj = new Date(currentDate);
    const currentDateTime = currentDateObj.getTime();

    // Filtrar y ordenar transacciones excluyendo la actual
    const otherTransactions = sortedTransactions
      .filter(t => t.id !== this.transaction.id)
      .sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        if (dateA !== dateB) {
          return dateA - dateB;
        }
        // Si tienen la misma fecha, ordenar por id (el último es el más reciente)
        return a.id - b.id;
      });

    // Buscar el último registro anterior a la fecha actual
    // Si hay múltiples con la misma fecha, tomar el último (mayor id)
    let previousTransaction: Transaction | null = null;

    for (let i = otherTransactions.length - 1; i >= 0; i--) {
      const prevDate = new Date(otherTransactions[i].date).getTime();

      // Si encontramos una transacción anterior o igual en fecha
      if (prevDate <= currentDateTime) {
        previousTransaction = otherTransactions[i];
        break;
      }
    }

    if (!previousTransaction) {
      // No hay transacción anterior, es la primera
      return null;
    }

    // Obtener el balance_after del registro anterior
    const previousBalance = parseFloat(String(previousTransaction.balance_after || 0));
    const currentAmount = parseFloat(String(this.form?.get('amount')?.value || this.transaction.amount || 0));

    // Calcular: balance anterior + importe actual
    const result = previousBalance + currentAmount;
    
    // Asegurarse de que el resultado es un número válido
    return isNaN(result) ? null : Number(result.toFixed(2));
  }

  async recalculateBalance(): Promise<void> {
    if (this.isFirstTransaction) {
      return;
    }

    const allTransactions = await this.transactionService.getTransactions();
    const sortedTransactions = [...allTransactions].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      if (dateA !== dateB) {
        return dateA - dateB;
      }
      return a.id - b.id;
    });

    this.calculatedBalance = this.calculateBalanceAfter(sortedTransactions);

    if (this.calculatedBalance !== null && !isNaN(this.calculatedBalance)) {
      // Habilitar temporalmente para actualizar el valor
      this.form.get('balance_after')?.enable();
      // Asegurarse de que el valor es un número válido
      const balanceValue = Number(this.calculatedBalance.toFixed(2));
      this.form.get('balance_after')?.setValue(balanceValue, { emitEvent: false });
      // Deshabilitar de nuevo
      this.form.get('balance_after')?.disable();
    }
  }

  get isFormValid(): boolean {
    if (!this.form) return false;
    // Si balance_after está deshabilitado, verificar manualmente los otros campos
    if (!this.isFirstTransaction && this.form.get('balance_after')?.disabled) {
      return this.form.get('date')?.valid && 
             this.form.get('name')?.valid && 
             this.form.get('amount')?.valid && 
             this.form.get('category_id')?.valid || false;
    }
    return this.form.valid;
  }

  async onSubmit(): Promise<void> {
    if (this.isFormValid) {
      // Obtener valores del formulario (incluyendo campos deshabilitados)
      const formData = this.form.getRawValue();

      // Si no es la primera transacción, usar el balance calculado
      let balanceAfter: number | undefined;
      if (this.isFirstTransaction) {
        const balance = formData.balance_after;
        balanceAfter = balance !== null && balance !== undefined ? Number(balance) : undefined;
      } else {
        // Recalcular antes de enviar
        await this.recalculateBalance();
        balanceAfter = this.calculatedBalance !== null && !isNaN(this.calculatedBalance) 
          ? Number(this.calculatedBalance.toFixed(2)) 
          : undefined;
      }

      // Convertir category_id a número y asegurarse de que los valores numéricos sean válidos
      const transactionData: Partial<Transaction> = {
        date: formData.date,
        name: formData.name,
        amount: parseFloat(String(formData.amount)) || 0,
        category_id: parseInt(String(formData.category_id), 10) || 0,
        description: formData.description || '',
        balance_after: balanceAfter !== undefined && balanceAfter !== null ? Number(balanceAfter.toFixed(2)) : undefined
      };

      console.log('Actualizando transacción:', transactionData);
      console.log('ID de transacción:', this.transaction.id);

      try {
        const updated = await this.transactionService.updateTransaction(this.transaction.id, transactionData);
        if (updated) {
          console.log('Transacción actualizada:', updated);
          // Cerrar el modal
          this.modalService.close();
          // Recargar la página para mostrar los cambios
          window.location.reload();
        } else {
          console.error('Error al actualizar la transacción: la respuesta fue null');
          alert('Error al actualizar la transacción. Por favor, inténtalo de nuevo.');
        }
      } catch (error) {
        console.error('Error al actualizar la transacción:', error);
        alert('Error al actualizar la transacción. Por favor, inténtalo de nuevo.');
      }
    }
  }

  onReset(): void {
    this.modalService.close();
  }
}

