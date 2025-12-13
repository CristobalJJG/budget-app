import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { AuthService } from '../../services/auth.service';
import { Observable } from 'rxjs';
import { User } from '../../services/auth.service';

@Component({
  selector: 'NavBar',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslatePipe],
  templateUrl: './navbar.component.html'
})
export class NavbarComponent implements OnInit {
  currentUser$!: Observable<User | null>;
  isMenuOpen = false;
  theme: 'light' | 'dark' = 'dark';

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.currentUser$ = this.authService.currentUser$;
    this.currentUser$.subscribe((user) => {
      const nextTheme = (user?.theme as 'light' | 'dark') || 'dark';
      this.theme = nextTheme;
      this.authService.applyTheme(nextTheme);
    });
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  logout(): void {
    // Limpiar el localStorage primero
    this.authService.logout();
    // Navegar a login
    this.router.navigate(['/login']);
  }

  async toggleTheme(): Promise<void> {
    const nextTheme: 'light' | 'dark' = this.theme === 'dark' ? 'light' : 'dark';
    await this.setTheme(nextTheme);
  }

  private async setTheme(theme: 'light' | 'dark'): Promise<void> {
    this.theme = theme;
    this.authService.applyTheme(theme);

    if (this.authService.isAuthenticated()) {
      await this.authService.updateTheme(theme);
    }
  }
}
