import { Pipe, PipeTransform, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Subscription } from 'rxjs';
import { TranslationService } from '../services/translation.service';

@Pipe({ name: 'translate', standalone: true, pure: false })
export class TranslatePipe implements PipeTransform, OnDestroy {
  private sub: Subscription;

  constructor(private t: TranslationService, private cdr: ChangeDetectorRef) {
    // subscribe to language changes to trigger update
    this.sub = this.t.lang$.subscribe(() => {
      // mark view for check so Angular re-evaluates impure pipe
      this.cdr.markForCheck();
    });
  }

  transform(key: string, fallback?: string): string {
    return this.t.translate(key, fallback);
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
