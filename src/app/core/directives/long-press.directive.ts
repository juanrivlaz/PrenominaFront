import { Directive, HostListener, output, signal } from '@angular/core';

@Directive({
    selector: '[appLongPress]'
})
export class LongPressDirective {
    // Output usando signal-based API
    public readonly longPress = output<void>();

    private timeout: ReturnType<typeof setTimeout> | null = null;
    private readonly isLongPressing = signal(false);

    @HostListener('mousedown', ['$event'])
    @HostListener('touchstart', ['$event'])
    onPressStart(event: Event): void {
        event.preventDefault();
        this.isLongPressing.set(false);
        this.timeout = setTimeout(() => {
            this.isLongPressing.set(true);
            this.longPress.emit();
        }, 2000);
    }

    @HostListener('mouseup')
    @HostListener('mouseleave')
    @HostListener('touchend')
    @HostListener('touchcancel')
    onPressEnd(): void {
        if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = null;
        }
    }
}
