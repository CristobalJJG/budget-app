import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableComponent } from '../../components/table/table.component';
import { ModalComponent } from '../../components/modal/modal.component';
import { AddRecordComponent } from '../../components/modal/add-record/add-record.component';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { MonthSelectorComponent } from '../../components/month-selector/month-selector.component';
import { ModalService } from '../../services/modal.service';
import { TransactionsService, Transaction } from '../../services/transactions.service';
import { LocalStorageService } from '../../services/local-storage.service';
import * as ninerosData from '../../../data/nineros.json';

@Component({
  selector: 'app-month',
  imports: [CommonModule, TableComponent, ModalComponent, AddRecordComponent, TranslatePipe, MonthSelectorComponent],
  templateUrl: './month.component.html'
})
export class MonthComponent {
  data: Transaction[] = [];
  allTransactions: Transaction[] = [];
  // Transactions filtered for the currently selected month (user-requested)
  selectedTransactions: Transaction[] = [];

  // Selected month/year (0-based month)
  selectedYear: number;
  selectedMonth: number;

  monthLabel = '';

  constructor(private modalService: ModalService, private transactionsService: TransactionsService,
    private localStorageService: LocalStorageService
  ) {
    const now = new Date();
    this.selectedYear = now.getFullYear();
    this.selectedMonth = now.getMonth();
  }

  ngOnInit() {
    // Load persisted/demo data first (if present)
    const raw: any = (ninerosData as any) || {};
    // Support multiple shapes of demo data:
    // - an array of transactions
    // - an object with a `nineros` property that holds months -> arrays
    if (Array.isArray(raw)) {
      this.allTransactions = raw;
    } else if (raw && raw.nineros && typeof raw.nineros === 'object') {
      // flatten all month arrays into a single transactions array
      const flattened = Object.values(raw.nineros).flat() as unknown[];
      this.allTransactions = flattened.map(item => item as Transaction);
    } else {
      this.allTransactions = [];
    }
    // If user stored transactions in localStorage, prefer those
    const persisted = this.readTransactionsFromLocalStorage();
    if (persisted && persisted.length > 0) {
      this.allTransactions = persisted;
    }

    this.updateMonthLabel();
    this.filterForSelectedMonth();

    // Then try to load from API in background
    this.transactionsService.getTransactions().then((txs) => {
      if (txs && txs.length > 0) {
        this.allTransactions = txs;
        this.filterForSelectedMonth();
      }
    }).catch(err => {
      console.warn('No se pudieron cargar transacciones remotas:', err);
    });
  }

  openModal(): void {
    this.modalService.open({
      title: 'Añadir nuevo registro',
      isDanger: false,
    });
  }

  private updateMonthLabel() {
    const dt = new Date(this.selectedYear, this.selectedMonth, 1);
    // use locale-aware month name (Spanish by default)
    this.monthLabel = new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(dt);
  }

  prevMonth() {
    if (this.selectedMonth === 0) {
      this.selectedMonth = 11;
      this.selectedYear -= 1;
    } else {
      this.selectedMonth -= 1;
    }
    this.updateMonthLabel();
    this.filterForSelectedMonth();
  }

  nextMonth() {
    if (this.selectedMonth === 11) {
      this.selectedMonth = 0;
      this.selectedYear += 1;
    } else {
      this.selectedMonth += 1;
    }
    this.updateMonthLabel();
    this.filterForSelectedMonth();
  }

  private filterForSelectedMonth() {
    const month = this.selectedMonth;
    const year = this.selectedYear;

    // Calculate UTC start and end for the selected month (inclusive)
    const startEpoch = Date.UTC(year, month, 1, 0, 0, 0, 0);
    const endEpoch = Date.UTC(year, month + 1, 0, 23, 59, 59, 999);

    // Debug: sample how dates are parsed (first 30 entries)
    try {
      const sample = (this.allTransactions || []).slice(0, 30).map((t: any) => {
        const raw = t && t.date;
        const ts = this.parseDateToEpoch(raw);
        const utc = ts === null ? null : new Date(ts);
        return {
          raw,
          ts,
          utcIso: utc ? utc.toISOString() : null,
          utcYear: utc ? utc.getUTCFullYear() : null,
          utcMonth: utc ? utc.getUTCMonth() : null,
          localYear: utc ? utc.getFullYear() : null,
          localMonth: utc ? utc.getMonth() : null,
        };
      });
      console.debug('filterForSelectedMonth: selected range', new Date(startEpoch).toISOString(), '->', new Date(endEpoch).toISOString());
      console.debug('filterForSelectedMonth: sample parsed dates (first 30):', sample);
    } catch (e) {
      console.debug('filterForSelectedMonth: debug parse error', e);
    }

    const list = (this.allTransactions || []).filter((t) => {
      const raw = (t as any).date;
      const ts = this.parseDateToEpoch(raw);
      if (ts === null) return false;
      return ts >= startEpoch && ts <= endEpoch;
    });
    debugger;
    this.data = list;
    this.selectedTransactions = list;

    console.debug('filterForSelectedMonth: selectedTransactions count', this.selectedTransactions.length);

    if ((!this.data || this.data.length === 0) && (this.allTransactions || []).length > 0) {
      console.debug('filterForSelectedMonth: no transactions for', year, month,
        'start:', new Date(startEpoch).toISOString(), 'end:', new Date(endEpoch).toISOString(),
        'total transactions:', (this.allTransactions || []).length,
        'sample dates:', (this.allTransactions || []).slice(0, 5).map((x: any) => x.date));
    }
  }

  // Robustly parse common date representations into an epoch (ms). Returns null if unparseable.
  private parseDateToEpoch(value: any): number | null {
    if (value === null || value === undefined) return null;
    if (typeof value === 'number' && !isNaN(value)) return value;
    if (typeof value === 'string') {
      // Plain date like YYYY-MM-DD -> treat as UTC date at midnight
      const plainDate = /^\d{4}-\d{2}-\d{2}$/.test(value);
      if (plainDate) {
        const parts = value.split('-').map(p => parseInt(p, 10));
        if (parts.length === 3 && !parts.some(isNaN)) {
          return Date.UTC(parts[0], parts[1] - 1, parts[2]);
        }
      }
      // Try Date.parse for ISO or full datetime strings
      const parsed = Date.parse(value);
      if (!isNaN(parsed)) return parsed;
    }
    // Fallback: try constructing Date
    const dt = new Date(value);
    if (!isNaN(dt.getTime())) return dt.getTime();
    return null;
  }

  // Try reading transactions from localStorage (if the app stores them there).
  private readTransactionsFromLocalStorage(): Transaction[] | null {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return null;
      const raw = window.localStorage.getItem('transactions') || window.localStorage.getItem('txs') || window.localStorage.getItem('allTransactions');
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map((x: any) => x as Transaction);
      return null;
    } catch (e) {
      console.debug('readTransactionsFromLocalStorage: error parsing', e);
      return null;
    }
  }
}
