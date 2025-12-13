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
  `
})
export class ServicesConfigComponent {
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
}
