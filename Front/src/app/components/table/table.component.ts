import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { LocalStorageService } from '../../services/local-storage.service';
import { CategoriesService, Category } from '../../services/categories.service';
import { TransactionsService, Transaction } from '../../services/transactions.service';
import { AlertService } from '../../services/alert.service';
import { TranslationService } from '../../services/translation.service';
import { LOCAL_STORAGE_KEY, TRANSACTIONS_KEY } from '../../constants/keys';
import { ConfigService } from '../../services/config.service';
import { ModalService } from '../../services/modal.service';
import { EditRecordComponent } from '../modal/edit-record/edit-record.component';
import { ModalComponent } from '../modal/modal.component';

@Component({
  selector: 'app-table',
  standalone: true,
  imports: [CommonModule, TranslatePipe, EditRecordComponent, ModalComponent],
  providers: [DatePipe],
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss']
})
/**
 * TableComponent
 *
 * Purpose:
 * - Present transaction data in a tabular format.
 * - This component accepts `data` as an input and will prefer external data
 *   (for example, a filtered subset provided by a parent container) before
 *   falling back to localStorage/server-loaded transactions.
 *
 * Notes for maintainers:
 * - Keep this component presentational: it should not be responsible for
 *   high-level filtering or business logic. Parents (containers/pages)
 *   should provide already-filtered arrays when possible.
 */
export class TableComponent implements OnChanges {
  @Input() data!: any;
  rows: any[] = [];
  titles: string[] = [];
  showedTitles: { [key: string]: boolean } = {};
  toggleableColumns: string[] = ['category', 'description'];
  currencyOptions: any;

  selectedTransaction: Transaction | null = null;
  isFirstTransaction: boolean = false;
  firstTransactionId: number | null = null;

  constructor(
    protected datePipe: DatePipe,
    private readonly localStorageService: LocalStorageService,
    private readonly categoriesService: CategoriesService,
    private readonly transactionsService: TransactionsService,
    private readonly configService: ConfigService,
    private readonly modalService: ModalService,
    private readonly alertService: AlertService,
    private readonly translationService: TranslationService
  ) {
    this.configService.config$.subscribe(() => {
      this.currencyOptions = this.configService.getCurrencyPipeOptions();
    });
  }

  ngOnInit() {
    // Obtenemos las categorías primero
    this.categoriesService.getCategories().catch();

    // If an external `data` input was provided (e.g. from MonthComponent), prefer it.
    if (this.data && Array.isArray(this.data) && this.data.length > 0) {
      this.applyRows(this.data);
      return;
    }

    // Otherwise, reload transactions from storage/server
    this.loadTransactions();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['data'] && this.data && Array.isArray(this.data)) {
      this.applyRows(this.data);
    }
  }

  loadTransactions() {
    this.transactionsService.getTransactions()
      .then(() => {
        const transactionsFromStorage = this.localStorageService.getItem<Transaction[]>(TRANSACTIONS_KEY);
        if (transactionsFromStorage && transactionsFromStorage.length > 0) {
          this.applyRows(transactionsFromStorage);
        }
      })
      .catch(error => {
        const msg = this.translationService.translate('alerts.errorLoadingTransactions', 'Error loading transactions');
        this.alertService.error(msg + ': ' + (error?.message || error));
        console.error('Error al obtener y guardar las transacciones:', error);
      });
  }

  private applyRows(rows: any[]) {
    this.rows = rows;
    this.titles = Object.keys(this.rows[0] || {});

    // Determinar el ID de la primera transacción
    const sortedTransactions = [...this.rows].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      if (dateA !== dateB) {
        return dateA - dateB;
      }
      return a.id - b.id;
    });

    this.firstTransactionId = sortedTransactions.length > 0 ? sortedTransactions[0].id : null;

    // Verificar si las transacciones tienen el color de categoría
    const firstTransaction = this.rows[0];
    const hasCategoryColor = firstTransaction && (
      (firstTransaction['Category'] && firstTransaction['Category'].color) ||
      (firstTransaction['category'] && firstTransaction['category'].color)
    );

    if (!hasCategoryColor) {
      const warn = this.translationService.translate('alerts.noCategoryColors', 'Transactions lack category colors');
      this.alertService.warning(warn);
      console.log('⚠️ Las transacciones no tienen color de categoría. Recargando desde el servidor...');
      // Limpiar localStorage para forzar recarga
      this.localStorageService.removeItem(TRANSACTIONS_KEY);
      // Recargar
      this.transactionsService.getTransactions()
        .then(() => {
          const newTransactions = this.localStorageService.getItem<Transaction[]>(TRANSACTIONS_KEY);
          if (newTransactions) {
            this.rows = newTransactions;
          }
        });
    }

    const savedShowedTitles = this.localStorageService.getItem<{ [key: string]: boolean }>(LOCAL_STORAGE_KEY);

    if (savedShowedTitles) this.showedTitles = savedShowedTitles;
    else {
      this.titles.forEach(title => this.showedTitles[title] = true);
      this.toggleableColumns.forEach(column => {
        this.showedTitles[column] = false;
      });
    }

    this.localStorageService.setItem(LOCAL_STORAGE_KEY, this.showedTitles);
  }

  toggleTitle(title: string) {
    this.showedTitles[title] = !this.showedTitles[title];
    this.localStorageService.setItem(LOCAL_STORAGE_KEY, this.showedTitles);
  }

  formatTitle(title: string): string {
    return title.charAt(0).toUpperCase() + title.slice(1);
  }

  /**
   * Obtiene el color de la categoría desde el objeto de transacción o desde las categorías almacenadas
   */
  getCategoryColor(item: any): string | null {
    // Primero intentar obtener el color directamente de la categoría en la transacción
    let categoryObj = null;

    if (item['Category']) {
      categoryObj = item['Category'];
    } else if (item['category']) {
      categoryObj = item['category'];
    }

    if (categoryObj) {
      // Intentar diferentes formas de acceder al color
      if (categoryObj.color) {
        return categoryObj.color;
      } else if (categoryObj.dataValues && categoryObj.dataValues.color) {
        return categoryObj.dataValues.color;
      }
    }

    // Si no encontramos el color en la transacción, buscarlo en las categorías almacenadas
    if (item['category_id']) {
      const categories = this.localStorageService.getItem<Category[]>('categories');
      if (categories && Array.isArray(categories)) {
        const category = categories.find(cat => cat.id === item['category_id']);
        if (category && category.color) {
          return category.color;
        }
      }
    }

    return null;
  }

  /**
   * Calcula el contraste de luminancia entre un color y el fondo
   * Retorna true si debe usar texto blanco, false si debe usar texto negro
   */
  getContrastColor(color: string): string {
    if (!color) return '#000000';

    const mapped = this.mapThemeContentColor(color);
    if (mapped) return mapped;

    if (color.startsWith('#') && (color.length === 7 || color.length === 4)) {
      return this.getHexContrast(color);
    }

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

  /**
   * Obtiene el color de fondo de la categoría
   */
  getCategoryBackgroundColor(item: any): string {
    const color = this.getCategoryColor(item);
    return color || 'transparent';
  }

  /**
   * Obtiene el color de texto de la categoría basado en el contraste
   */
  getCategoryTextColor(item: any): string {
    const color = this.getCategoryColor(item);
    if (!color) {
      return '';
    }
    return this.getContrastColor(color);
  }

  async openEditModal(transaction: any): Promise<void> {
    // Convertir el objeto de transacción al formato esperado
    const transactionData: Transaction = {
      id: transaction.id,
      date: transaction.date,
      name: transaction.name,
      amount: transaction.amount,
      category_id: transaction.category_id || (transaction.Category ? transaction.Category.id : transaction.category?.id),
      description: transaction.description || '',
      balance_after: transaction.balance_after || undefined,
      user_id: transaction.user_id
    };

    this.selectedTransaction = transactionData;

    // Determinar si es la primera transacción
    const allTransactions = await this.transactionsService.getTransactions();
    const sortedTransactions = [...allTransactions].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      if (dateA !== dateB) {
        return dateA - dateB;
      }
      return a.id - b.id;
    });

    this.isFirstTransaction = sortedTransactions.length > 0 && sortedTransactions[0].id === transaction.id;

    // Abrir el modal después de establecer la transacción
    setTimeout(() => {
      this.modalService.open({
        title: 'Editar transacción',
        isDanger: false,
      });
    }, 0);
  }

  openDeleteModal(transaction: any): void {
    if (this.isFirstTransactionRecord(transaction)) {
      alert('No se puede eliminar el primer registro');
      return;
    }

    this.modalService.open({
      title: 'Eliminar transacción',
      content: '¿Está seguro que quiere eliminar este registro?',
      isDanger: true,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      onConfirm: async () => {
        await this.transactionsService.deleteTransaction(transaction.id);
        // Recargar transacciones
        await this.loadTransactions();
        window.location.reload();
      }
    });
  }

  isFirstTransactionRecord(transaction: any): boolean {
    return this.firstTransactionId !== null && transaction.id === this.firstTransactionId;
  }
}
