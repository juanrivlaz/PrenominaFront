import { Directive, OnDestroy } from '@angular/core';
import { Subject, timer, Observable } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

/**
 * Clase base para componentes que requieren manejo de subscripciones.
 * Implementa automáticamente la limpieza de subscripciones al destruir el componente.
 *
 * Uso:
 * ```typescript
 * @Component({...})
 * export class MiComponent extends BaseComponent implements OnInit {
 *   ngOnInit() {
 *     this.someObservable$
 *       .pipe(this.untilDestroyed())
 *       .subscribe(...);
 *
 *     // En lugar de setTimeout
 *     this.safeTimeout(800).subscribe(() => {
 *       // código
 *     });
 *   }
 * }
 * ```
 */
@Directive()
export abstract class BaseComponent implements OnDestroy {
    protected readonly destroy$ = new Subject<void>();

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    /**
     * Operador pipe para limpiar subscripciones automáticamente
     */
    protected untilDestroyed<T>() {
        return (source: Observable<T>) => source.pipe(takeUntil(this.destroy$));
    }

    /**
     * Alternativa segura a setTimeout que se cancela automáticamente
     * @param delay Tiempo de espera en milisegundos
     */
    protected safeTimeout(delay: number): Observable<number> {
        return timer(delay).pipe(takeUntil(this.destroy$));
    }

    /**
     * Alternativa segura a setInterval que se cancela automáticamente
     * @param period Período en milisegundos
     * @param initialDelay Delay inicial (por defecto igual al período)
     */
    protected safeInterval(period: number, initialDelay?: number): Observable<number> {
        return timer(initialDelay ?? period, period).pipe(takeUntil(this.destroy$));
    }
}

/**
 * Función utilitaria para crear un operador takeUntil con un Subject
 * Útil para casos donde no se puede extender BaseComponent
 */
export function createDestroyNotifier(): {
    destroy$: Subject<void>;
    cleanup: () => void;
    untilDestroyed: <T>() => (source: Observable<T>) => Observable<T>;
} {
    const destroy$ = new Subject<void>();

    return {
        destroy$,
        cleanup: () => {
            destroy$.next();
            destroy$.complete();
        },
        untilDestroyed: <T>() => (source: Observable<T>) => source.pipe(takeUntil(destroy$))
    };
}
