import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableComponent } from '../../components/table/table.component';
import { ModalComponent } from '../../components/modal/modal.component';
import { AddRecordComponent } from '../../components/modal/add-record/add-record.component';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { MonthSelectorComponent } from '../../components/month-selector/month-selector.component';
import { ModalService } from '../../services/modal.service';
import { TransactionsService, Transaction } from '../../services/transactions.service';
import { ServicesService } from '../../services/services.service';
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

  constructor(private modalService: ModalService,
    private transactionsService: TransactionsService,
    private servicesService: ServicesService
  ) {
    const now = new Date();
    this.selectedYear = now.getFullYear();
    this.selectedMonth = now.getMonth();
  }

  // Bound handler reference so we can remove the listener later
  private onTransactionsChangedBound = () => {
    this.handleTransactionsChanged();
  };

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
    // filterForSelectedMonth is async now because it fetches service records
    this.filterForSelectedMonth().catch(err => console.error(err));

    // Then try to load from API in background
    this.transactionsService.getTransactions().then((txs) => {
      if (txs && txs.length > 0) {
        this.allTransactions = txs;
        this.filterForSelectedMonth().catch(err => console.error(err));
      }
    }).catch(err => {
      console.warn('No se pudieron cargar transacciones remotas:', err);
    });

    // Listen for external notifications that transactions changed (e.g., after create)
    try {
      window.addEventListener('transactions:changed', this.onTransactionsChangedBound);
    } catch (e) { }
  }

  ngOnDestroy() {
    try {
      window.removeEventListener('transactions:changed', this.onTransactionsChangedBound);
    } catch (e) { }
  }

  private handleTransactionsChanged() {
    // Re-fetch from API/localStorage and re-filter
    this.transactionsService.getTransactions().then((txs) => {
      if (txs && txs.length > 0) {
        this.allTransactions = txs;
        this.filterForSelectedMonth();
      } else {
        const persisted = this.readTransactionsFromLocalStorage();
        if (persisted) {
          this.allTransactions = persisted;
          this.filterForSelectedMonth();
        }
      }
    }).catch(() => {
      const persisted = this.readTransactionsFromLocalStorage();
      if (persisted) {
        this.allTransactions = persisted;
        this.filterForSelectedMonth();
      }
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

  private async filterForSelectedMonth() {
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
    this.data = list;
    this.selectedTransactions = list;

    console.debug('filterForSelectedMonth: selectedTransactions count', this.selectedTransactions.length);

    if ((!this.data || this.data.length === 0) && (this.allTransactions || []).length > 0) {
      console.debug('filterForSelectedMonth: no transactions for', year, month,
        'start:', new Date(startEpoch).toISOString(), 'end:', new Date(endEpoch).toISOString(),
        'total transactions:', (this.allTransactions || []).length,
        'sample dates:', (this.allTransactions || []).slice(0, 5).map((x: any) => x.date));
    }
    // Calculate starting balance from service_records of previous month
    try {
      // previous month in ServicesService is 1-based (1..12)
      const prevMonthNum = month === 0 ? 12 : month; // if selectedMonth is 0 (Jan), prev is Dec (12)
      const prevYear = month === 0 ? year - 1 : year;
      const serviceRecords = await this.servicesService.getRecords(prevYear, prevMonthNum);
      const startingBalance = (serviceRecords || []).reduce((sum, r) => sum + (r.amount || 0), 0);

      // Sort selected transactions by date then id, then compute running balance
      const sorted = [...this.selectedTransactions].sort((a, b) => {
        const ta = this.parseDateToEpoch(a.date) || 0;
        const tb = this.parseDateToEpoch(b.date) || 0;
        if (ta !== tb) return ta - tb;
        return (a.id || 0) - (b.id || 0);
      });

      let running = startingBalance;
      for (const tx of sorted) {
        const amt = Number(tx.amount) || 0;
        running += amt;
        tx.balance_after = running;
      }

      // Update this.selectedTransactions with computed balances in original order
      const mapped = this.selectedTransactions.map(s => {
        const match = sorted.find(x => x.id === s.id);
        return match || s;
      });
      this.selectedTransactions = mapped;
      this.data = mapped;
    } catch (e) {
      console.warn('Could not compute starting balance from service records', e);
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
