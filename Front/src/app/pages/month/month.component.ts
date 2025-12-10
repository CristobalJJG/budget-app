import { Component } from '@angular/core';
import { TableComponent } from '../../components/table/table.component';
import { ModalComponent } from '../../components/modal/modal.component';
import { AddRecordComponent } from '../../components/modal/add-record/add-record.component';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { ModalService } from '../../services/modal.service';
import * as ninerosData from '../../../data/nineros.json';

@Component({
  selector: 'app-month',
  imports: [TableComponent, ModalComponent, AddRecordComponent, TranslatePipe],
  templateUrl: './month.component.html'
})
export class MonthComponent {
  data: any;

  constructor(private modalService: ModalService) { }

  ngOnInit() {
    this.data = ninerosData;
    console.log(ninerosData);
  }

  openModal(): void {
    this.modalService.open({
      title: 'Añadir nuevo registro',
      isDanger: false,
    });
  }
}
