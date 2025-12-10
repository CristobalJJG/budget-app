import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalService } from '../../services/modal.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-modal',
  imports: [CommonModule, TranslatePipe],
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.scss'
})
export class ModalComponent {
  isOpen$;
  modalConfig$;

  constructor(public modalService: ModalService) {
    this.isOpen$ = this.modalService.isOpen$;
    this.modalConfig$ = this.modalService.modalConfig$;
  }


  onConfirm(): void {
    this.modalService.confirm();
  }

  onCancel(): void {
    this.modalService.cancel();
  }
}
