import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ServicesService, ServiceItem, ServiceRecord } from '../../services/services.service';
import { TransactionsService } from '../../services/transactions.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
    selector: 'app-general',
    standalone: true,
    imports: [CommonModule, FormsModule, TranslatePipe],
    templateUrl: './general.component.html'
})
export class GeneralComponent {
    services: ServiceItem[] = [];
    recordsMap: Record<number, Record<number, ServiceRecord | null>> = {};
    // pending numeric values per service/month (not yet saved)
    pendingRecords: Record<number, Record<number, number | null>> = {};
    months: { num: number; label: string }[] = [];
    loading = true;
    currentYear = new Date().getFullYear();

    // months with unsaved changes
    changedMonths = new Set<number>();
    // months currently being saved
    savingMonths = new Set<number>();

    constructor(private servicesApi: ServicesService, private transactionsService: TransactionsService) {
        this.initMonths(this.currentYear);
        this.load();
    }

    private initMonths(year?: number) {
        // default: show full year months unless viewing the current year (then up to current month)
        this.months = [];
        const now = new Date();
        const currentMonth = now.getMonth() + 1; // 1-12
        const viewYear = year ?? this.currentYear;
        const maxMonth = (viewYear === now.getFullYear()) ? currentMonth : 12;
        for (let m = 1; m <= maxMonth; m++) {
            this.months.push({ num: m, label: String(m) });
        }
    }

    prevYear() {
        this.currentYear -= 1;
        this.onYearChange();
    }

    nextYear() {
        this.currentYear += 1;
        this.onYearChange();
    }

    private onYearChange() {
        // clear pending edits when switching year
        this.pendingRecords = {};
        this.changedMonths.clear();
        this.savingMonths.clear();
        this.initMonths(this.currentYear);
        this.load();
    }

    private async load() {
        this.loading = true;
        try {
            this.services = await this.servicesApi.getServices();
            const records = await this.servicesApi.getRecords(this.currentYear);

            // build recordsMap: service_id -> month -> record
            this.recordsMap = {};
            for (const s of this.services) {
                this.recordsMap[s.id] = {};
                for (const m of this.months) this.recordsMap[s.id][m.num] = null;
            }

            // Initialize pendingRecords from existing records
            this.pendingRecords = {};
            for (const r of records) {
                if (!this.recordsMap[r.service_id]) this.recordsMap[r.service_id] = {};
                this.recordsMap[r.service_id][r.month] = r;
                if (!this.pendingRecords[r.service_id]) this.pendingRecords[r.service_id] = {};
                this.pendingRecords[r.service_id][r.month] = r.amount;
            }
        } catch (e) {
            console.error('Error loading general data', e);
        } finally {
            this.loading = false;
        }
    }

    getPendingAmount(serviceId: number, month: number): number | null {
        const pending = this.pendingRecords[serviceId]?.[month];
        if (pending !== undefined && pending !== null) return pending;
        const r = this.recordsMap[serviceId]?.[month];
        return r ? r.amount : null;
    }

    onAmountEdit(value: string | number, service: ServiceItem, month: number) {
        const parsed = Number(value);
        const amount = isNaN(parsed) ? 0 : parsed;

        if (!this.pendingRecords[service.id]) this.pendingRecords[service.id] = {};
        this.pendingRecords[service.id][month] = amount;

        // determine if this month has any changes compared to original
        let anyChanged = false;
        for (const s of this.services) {
            const orig = this.recordsMap[s.id]?.[month]?.amount ?? null;
            const pending = this.pendingRecords[s.id]?.[month] ?? null;
            if ((orig ?? null) !== (pending ?? null)) {
                anyChanged = true;
                break;
            }
        }
        if (anyChanged) this.changedMonths.add(month);
        else this.changedMonths.delete(month);
    }

    isMonthDirty(month: number): boolean {
        return this.changedMonths.has(month);
    }

    getRowSum(serviceId: number): number {
        let sum = 0;
        for (const m of this.months) {
            const val = this.pendingRecords[serviceId]?.[m.num];
            if (val !== undefined && val !== null) sum += Number(val);
            else {
                const rec = this.recordsMap[serviceId]?.[m.num];
                if (rec && rec.amount) sum += Number(rec.amount);
            }
        }
        return sum;
    }

    getColumnSum(month: number): number {
        let sum = 0;
        for (const s of this.services) {
            const val = this.pendingRecords[s.id]?.[month];
            if (val !== undefined && val !== null) sum += Number(val);
            else {
                const rec = this.recordsMap[s.id]?.[month];
                if (rec && rec.amount) sum += Number(rec.amount);
            }
        }
        return sum;
    }

    getGrandTotal(): number {
        let total = 0;
        for (const m of this.months) total += this.getColumnSum(m.num);
        return total;
    }

    async saveMonth(month: number) {
        if (!this.isMonthDirty(month)) return;
        this.savingMonths.add(month);

        const promises: Promise<any>[] = [];

        for (const s of this.services) {
            const pending = this.pendingRecords[s.id]?.[month];
            const existing = this.recordsMap[s.id]?.[month];
            const orig = existing?.amount ?? 0;
            const pendVal = pending ?? 0;
            if (orig === pendVal) continue; // nothing to do

            if (existing && existing.id) {
                promises.push(this.servicesApi.updateRecord(existing.id, { amount: pendVal }).then((updated) => {
                    if (updated) this.recordsMap[s.id][month] = updated;
                }).catch((e) => console.error('Error updating record', e)));
            } else {
                promises.push(this.servicesApi.createRecord({ service_id: s.id, year: this.currentYear, month, amount: pendVal }).then((created) => {
                    if (created) this.recordsMap[s.id][month] = created;
                }).catch((e) => console.error('Error creating record', e)));
            }
        }

        try {
            await Promise.all(promises);
            // after save, clear changed flag for this month
            this.changedMonths.delete(month);
            // refresh transactions (so Month view/table reflect new opening transaction)
            try { await this.transactionsService.getTransactions(); } catch (e) { /* ignore */ }
        } finally {
            this.savingMonths.delete(month);
        }
    }
}
