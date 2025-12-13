import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * MonthSelectorComponent
 * - Presentational component that renders previous/next buttons and the current month label.
 * - Emits `prev` and `next` events so parent container handles the navigation logic.
 * - Keeps markup & styling isolated for easier maintenance and testing.
 */
@Component({
    selector: 'app-month-selector',
    standalone: true,
    imports: [CommonModule],
    template: `
  <div class="mb-4 flex items-center justify-start gap-4">
    <div class="flex items-center gap-2">
      <button (click)="onPrev()" aria-label="Previous month" class="p-2 rounded-md bg-base-200 hover:bg-base-300">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M12.293 16.293a1 1 0 0 1-1.414 1.414l-6-6a1 1 0 0 1 0-1.414l6-6a1 1 0 0 1 1.414 1.414L7.414 10l4.879 4.879z" clip-rule="evenodd" />
        </svg>
      </button>

      <div class="w-[175px] text-center px-3 py-1 rounded text-sm font-medium">
        {{ label }}
      </div>

      <button (click)="onNext()" aria-label="Next month" class="p-2 rounded-md bg-base-200 hover:bg-base-300">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M7.707 3.707a1 1 0 0 1 0-1.414L14.707 10l-7 7a1 1 0 0 1-1.414-1.414L11.586 10 7.707 6.121z" clip-rule="evenodd" />
        </svg>
      </button>
    </div>

    <div class="flex-1"></div>

    <div class="flex justify-end">
      <ng-content select=".right-actions"></ng-content>
    </div>
  </div>
  `
})
export class MonthSelectorComponent {
    @Input() label = '';
    @Output() prev = new EventEmitter<void>();
    @Output() next = new EventEmitter<void>();

    onPrev() { this.prev.emit(); }
    onNext() { this.next.emit(); }
}
