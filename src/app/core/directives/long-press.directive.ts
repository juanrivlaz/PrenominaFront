import { Directive, EventEmitter, HostListener, Output } from '@angular/core';

@Directive({
  selector: '[appLongPress]'
})
export class LongPressDirective {
  @Output() longPress = new EventEmitter<void>();
  private timeout: any;
  private isLongPressing = false;

  @HostListener('mousedown', ['$event'])
  @HostListener('touchstart', ['$event'])
  onPressStart(event: Event): void {
    event.preventDefault();
    this.isLongPressing = false;
    this.timeout = setTimeout(() => {
      this.isLongPressing = true;
      this.longPress.emit();
    }, 2000);
  }

  @HostListener('mouseup')
  @HostListener('mouseleave')
  @HostListener('touchend')
  @HostListener('touchcancel')
  onPressEnd(): void {
    clearTimeout(this.timeout);
  }
}