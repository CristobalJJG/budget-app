import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AlertService, Alert } from '../../services/alert.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
    selector: 'app-alerts',
    standalone: true,
    imports: [CommonModule, TranslatePipe],
    template: `
  <div class="fixed top-4 right-4 z-50 flex flex-col gap-3">
    <ng-container *ngFor="let a of alerts">
      <div [ngClass]="alertClass(a.type)" class="alert shadow-lg max-w-lg">
        <div class="flex-1">
          <span class="font-medium" *ngIf="a.type === 'success'">{{ 'alerts.success' | translate }}</span>
          <span class="font-medium" *ngIf="a.type === 'error'">{{ 'alerts.error' | translate }}</span>
          <div class="mt-1">{{ a.message }}</div>
        </div>
        <div class="flex-none">
          <button class="btn btn-ghost btn-sm" (click)="close(a.id)">{{ 'alerts.dismiss' | translate }}</button>
        </div>
      </div>
    </ng-container>
  </div>
  `
})
export class AlertsComponent {
    alerts: Alert[] = [];

    constructor(private alertService: AlertService) {
        this.alertService.alerts$.subscribe(a => this.alerts = a);
    }

    alertClass(type: string) {
        switch (type) {
            case 'success': return 'alert-success';
            case 'error': return 'alert-error';
            case 'warning': return 'alert-warning';
            case 'info':
            default:
                return 'alert-info';
        }
    }

    close(id: string) { this.alertService.close(id); }
}
