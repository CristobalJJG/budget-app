import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfigService } from '../../../services/config.service';
import { TranslatePipe } from '../../../pipes/translate.pipe';

@Component({
    selector: 'app-currency-config',
    standalone: true,
    imports: [CommonModule, FormsModule, TranslatePipe],
    template: `
  <div class="p-2">
    <div class="flex flex-col gap-3">
      <h2 class="text-xl font-semibold">{{ 'config.currencySettings' | translate }}</h2>

      <div>
        <label class="block text-sm font-medium mb-1">{{ 'config.currency' | translate }}</label>
        <select [(ngModel)]="cfg.currency" class="select select-bordered w-full">
          <option value="USD">Dólar Estadounidense (USD)</option>
          <option value="EUR">Euro (EUR)</option>
          <option value="GBP">Libra Esterlina (GBP)</option>
          <option value="JPY">Yen Japonés (JPY)</option>
          <option value="CNY">Yuan Chino (CNY)</option>
        </select>
      </div>

      <div>
        <label class="block text-sm font-medium mb-1">{{ 'config.format' | translate }}</label>
        <select [(ngModel)]="cfg.currencyDisplay" class="select select-bordered w-full">
          <option value="symbol">Símbolo (€, $, £)</option>
          <option value="code">Código (EUR, USD, GBP)</option>
          <option value="name">Nombre (euro, dólar, libra)</option>
        </select>
      </div>

      <div>
        <label class="block text-sm font-medium mb-1">{{ 'config.region' | translate }}</label>
        <select [(ngModel)]="cfg.locale" class="select select-bordered w-full">
          <option value="en-US">Estados Unidos (en-US)</option>
          <option value="es-ES">España (es-ES)</option>
        </select>
      </div>

      <div class="mt-4 p-3 bg-base-200 rounded">
        <h3 class="font-semibold mb-2">{{ 'config.preview' | translate }}</h3>
        <p>
          {{ 'config.previewText' | translate }}
          {{ 1234.56 | currency:cfg.currency:'symbol':'1.2-2':cfg.locale}}
        </p>
      </div>

      <div class="mt-3">
        <button class="btn btn-primary" (click)="save()">{{ 'config.save' | translate }}</button>
      </div>
    </div>
  </div>
  `
})
export class CurrencyConfigComponent {
    cfg = this.configService.getConfig();

    constructor(private configService: ConfigService) { }

    save() {
        this.configService.updateConfig(this.cfg);
    }
}
