import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeSelectorComponent } from '../../../components/theme-selector/theme-selector.component';
import { AuthService } from '../../../services/auth.service';

@Component({
    selector: 'app-theme-config',
    standalone: true,
    imports: [CommonModule, ThemeSelectorComponent],
    template: `
  <div class="p-2">
    <app-theme-selector [theme]="theme" (themeChange)="onThemeChange($event)"></app-theme-selector>
  </div>
  `
})
export class ThemeConfigComponent {
    theme = 'dark';

    constructor(private auth: AuthService) {
        const user = this.auth.getCurrentUser();
        this.theme = (user?.theme as string) || 'dark';
    }

    async onThemeChange(theme: string) {
        this.theme = theme || 'dark';
        this.auth.applyTheme(this.theme);
        await this.auth.updateTheme(this.theme);
    }
}
