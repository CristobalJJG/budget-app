import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar.component';
import { AlertsComponent } from './components/alert/alerts.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavbarComponent, AlertsComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'budget-app';
}
