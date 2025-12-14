import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../../pipes/translate.pipe';

@Component({
    selector: 'app-theme-config',
    standalone: true,
    imports: [CommonModule, FormsModule, TranslatePipe],
    template: `
        <div class="bg-base-100 p-4 rounded-lg shadow border border-base-300">
        <div class="flex items-center justify-between mb-3">
                <h3 class="text-lg font-semibold">{{ 'config.theme' | translate }}</h3>
                <div class="flex items-center gap-2">
                    <div class="badge badge-outline">{{ theme }}</div>
                    <button class="btn btn-ghost btn-sm md:hidden" (click)="toggle()" aria-label="Toggle theme panel">
                        <svg *ngIf="!collapsed" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"/></svg>
                        <svg *ngIf="collapsed" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
                    </button>
                </div>
        </div>
        <div [class.hidden]="collapsed">
            <div class="form-control w-full flex items-center gap-2">
                <label class="label">
                <!-- Theme toggle -->
                <button class="btn btn-ghost btn-square" type="button" (click)="toggleTheme()" aria-label="Toggle theme">
                        <!-- Sun icon -->
                        <svg *ngIf="!isDark" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
                        <circle cx="12" cy="12" r="4" />
                        <line x1="12" y1="3" x2="12" y2="6" stroke-linecap="round" />
                        <line x1="12" y1="18" x2="12" y2="21" stroke-linecap="round" />
                        <line x1="4.22" y1="4.22" x2="6.34" y2="6.34" stroke-linecap="round" />
                        <line x1="17.66" y1="17.66" x2="19.78" y2="19.78" stroke-linecap="round" />
                        <line x1="3" y1="12" x2="6" y2="12" stroke-linecap="round" />
                        <line x1="18" y1="12" x2="21" y2="12" stroke-linecap="round" />
                        <line x1="4.22" y1="19.78" x2="6.34" y2="17.66" stroke-linecap="round" />
                        <line x1="17.66" y1="6.34" x2="19.78" y2="4.22" stroke-linecap="round" />
                        </svg>
                        <!-- Moon icon -->
                        <svg *ngIf="isDark" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
                        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" stroke-linecap="round" stroke-linejoin="round" />
                        </svg>
                </button>
                </label>
                <select class="select select-bordered" [ngModel]="theme" (ngModelChange)="selectTheme($event)">
                <option *ngFor="let t of currentOptions" [value]="t">{{ t }}</option>
                </select>
            </div>
        </div>
        </div>
    `,
})
export class ThemeSelectorConfig {
    collapsed = false;
    @Input() theme: string = 'light';
    @Output() themeChange = new EventEmitter<string>();

    // Claros
    lightThemes: string[] = [
        'light',
        'cupcake',
        'bumblebee',
        'emerald',
        'corporate',
        'retro',
        'cyberpunk',
        'valentine',
        'garden',
        'lofi',
        'pastel',
        'fantasy',
        'wireframe',
        'cmyk',
        'autumn',
        'acid',
        'lemonade',
        'winter',
        'nord',
        'caramellatte',
        'silk',
    ];

    // Oscuros
    darkThemes: string[] = [
        'dark',
        'synthwave',
        'forest',
        'halloween',
        'aqua',
        'black',
        'luxury',
        'dracula',
        'business',
        'night',
        'coffee',
        'dim',
        'sunset',
        'abyss',
    ];

    get isDark(): boolean {
        return this.darkThemes.includes(this.theme);
    }

    get currentOptions(): string[] {
        return this.isDark ? this.darkThemes : this.lightThemes;
    }

    selectTheme(theme: string) {
        this.theme = theme;
        this.themeChange.emit(theme);
    }

    toggleMode(checked: boolean) {
        const list = checked ? this.darkThemes : this.lightThemes;
        const next = list.includes(this.theme) ? this.theme : list[0];
        this.selectTheme(next);
    }

    toggleTheme() {
        const targetList = this.isDark ? this.lightThemes : this.darkThemes;
        const next = targetList.includes(this.theme) ? this.theme : targetList[0];
        this.selectTheme(next);
    }

    toggle() {
        this.collapsed = !this.collapsed;
    }
}

