import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, firstValueFrom } from 'rxjs';

export type SupportedLang = 'en' | 'es';

const SUPPORTED: SupportedLang[] = ['en', 'es'];

@Injectable({ providedIn: 'root' })
export class TranslationService {
  private currentLang$ = new BehaviorSubject<SupportedLang>('en');
  // Public observable for pipes/components to react to language changes
  public lang$ = this.currentLang$.asObservable();
  private translations: Record<string, any> = {};

  private isBrowser: boolean;

  constructor(private http: HttpClient, @Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    const rawSaved = this.isBrowser ? (localStorage.getItem('lang') as string | null) : null;
    const saved = this.normalizeLang(rawSaved || 'en');
    this.currentLang$.next(saved);
    if (this.isBrowser) {
      this.loadTranslations(saved).catch(() => { });
    }
  }

  get lang() {
    return this.currentLang$.value;
  }

  // Accepts 'en', 'es' or full locale like 'es-ES' and normalizes to supported short code
  async setLang(lang: string) {
    const short = this.normalizeLang(lang);
    if (short === this.lang) return;
    await this.loadTranslations(short);
    this.currentLang$.next(short);
    if (this.isBrowser) {
      localStorage.setItem('lang', short);
    }
  }

  async loadTranslations(lang: SupportedLang) {
    try {
      const url = `/assets/i18n/${lang}.json`;
      const data = await firstValueFrom(this.http.get<Record<string, any>>(url));
      this.translations = data || {};
    } catch (err) {
      console.error('Failed loading translations for', lang, err);
      this.translations = {};
    }
  }

  private normalizeLang(lang: string): SupportedLang {
    if (!lang) return 'en';
    const short = lang.split('-')[0].toLowerCase();
    return SUPPORTED.includes(short as SupportedLang) ? (short as SupportedLang) : 'en';
  }

  // key can be nested like "modal.confirm"
  translate(key: string, fallback?: string): string {
    if (!key) return fallback || key;
    // First, check if the translations object contains the full key as a literal (supports keys with dots)
    try {
      if (this.translations && Object.prototype.hasOwnProperty.call(this.translations, key)) {
        const literal = this.translations[key];
        return typeof literal === 'string' ? literal : (fallback ?? key);
      }
    } catch (e) {
      // ignore and continue to nested lookup
    }

    const parts = key.split('.');
    let cur: any = this.translations;
    for (const p of parts) {
      if (cur && p in cur) {
        cur = cur[p];
      } else {
        return fallback ?? key;
      }
    }
    return typeof cur === 'string' ? cur : fallback ?? key;
  }
}
