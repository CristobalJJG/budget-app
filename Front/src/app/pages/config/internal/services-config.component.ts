import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ServicesService, ServiceItem } from '../../../services/services.service';
import { AlertService } from '../../../services/alert.service';
import { TranslatePipe } from '../../../pipes/translate.pipe';
import { TranslationService } from '../../../services/translation.service';

@Component({
  selector: 'app-services-config',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  template: `
  <div class="p-2">
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-medium">{{ 'services.title' | translate }}</h3>
      <button class="btn btn-ghost btn-sm md:hidden" (click)="toggle()" aria-label="Toggle services">
        <svg *ngIf="!collapsed" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"/></svg>
        <svg *ngIf="collapsed" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
      </button>
    </div>

    <div [class.hidden]="collapsed" class="mt-3">
      <div class="mb-4 flex gap-2">
        <input [(ngModel)]="newName" placeholder="{{ 'services.placeholderName' | translate }}" class="input input-bordered w-full" />
        <button class="btn btn-primary" (click)="create()">{{ 'services.add' | translate }}</button>
      </div>

      <table class="table w-full">
        <thead>
          <tr>
            <th>{{ 'services.columns.name' | translate }}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let s of services">
            <td>{{ s.name }}</td>
            <td>
              <button class="btn btn-xs btn-error" (click)="remove(s.id)">{{ 'services.delete' | translate }}</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
  `
})
export class ServicesConfigComponent {
  collapsed = false;
  services: ServiceItem[] = [];
  newName = '';

  constructor(
    private servicesApi: ServicesService,
    private alert: AlertService,
    private translation: TranslationService
  ) {
    this.load();
  }

  async load() {
    this.services = await this.servicesApi.getServices();
  }

  async create() {
    if (!this.newName || this.newName.trim().length === 0) return;
    try {
      const svc = await this.servicesApi.createService({ name: this.newName.trim() });
      if (svc) {
        const msg = this.translation.translate('services.created', 'Service created');
        this.alert.success(msg);
        this.newName = '';
        this.load();
      }
    } catch (err: any) {
      console.error('Create service failed:', err);
      const serverMsg = err?.response?.data?.error || err?.message || 'Unknown error';
      const msg = this.translation.translate('services.errorCreate', 'Failed creating service');
      this.alert.error(`${msg}: ${serverMsg}`);
    }
  }

  remove(id: number) {
    if (!confirm('Delete service?')) return;
    this.servicesApi.deleteService(id).then(() => this.load());
  }

  toggle() {
    this.collapsed = !this.collapsed;
  }
}
