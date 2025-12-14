import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar.component';
import { AlertsComponent } from './components/alert/alerts.component';
import { ModalComponent } from './components/modal/modal.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavbarComponent, AlertsComponent, ModalComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'budget-app';
}
