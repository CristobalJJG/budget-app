import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-theme-selector',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './theme-selector.component.html',
})
export class ThemeSelectorComponent {
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
}

