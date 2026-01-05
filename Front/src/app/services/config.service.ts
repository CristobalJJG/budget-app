// src/app/services/config.service.ts
import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject } from 'rxjs';
import { TranslationService } from './translation.service';

export interface AppConfig {
  currency: string;
  currencyDisplay: 'symbol' | 'code' | 'name';
  locale: string;
}

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  private readonly CONFIG_KEY = 'app_config';
  private config: AppConfig = {
    currency: 'EUR',
    currencyDisplay: 'symbol',
    locale: 'es-ES'
  };

  private configSubject = new BehaviorSubject<AppConfig>(this.config);
  config$ = this.configSubject.asObservable();

  private isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) private platformId: Object, private translationService: TranslationService) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    this.loadConfig();
    // Ensure translation service reflects current config locale on startup
    // (setLang accepts full locale like 'es-ES' and normalizes internally)
    this.translationService.setLang(this.config.locale).catch(() => { });
  }

  private loadConfig() {
    if (!this.isBrowser) return;

    const savedConfig = localStorage.getItem(this.CONFIG_KEY);
    if (savedConfig) {
      this.config = JSON.parse(savedConfig);
      this.configSubject.next(this.config);
      // Update translation language to match saved config
      this.translationService.setLang(this.config.locale).catch(() => { });
    }
  }

  updateConfig(updates: Partial<AppConfig>) {
    this.config = { ...this.config, ...updates };
    if (this.isBrowser) {
      localStorage.setItem(this.CONFIG_KEY, JSON.stringify(this.config));
    }
    this.configSubject.next(this.config);
    // If locale changed, update translations
    if (updates.locale) {
      this.translationService.setLang(this.config.locale).catch(() => { });
    }
  }

  getConfig(): AppConfig {
    return { ...this.config };
  }

  getCurrencyPipeOptions() {
    return {
      currency: this.config.currency,
      display: this.config.currencyDisplay,
      digitsInfo: '1.2-2',
      locale: this.config.locale
    };
  }
}