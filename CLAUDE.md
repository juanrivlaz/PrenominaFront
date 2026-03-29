# Proyecto Prenomina - Frontend Angular

## Stack
- Angular 20.3.16 (SSR) + Angular Material
- Backend: .NET 8.0 Web API en `/Users/jrivera/Develop/WebApps/PrenominaApi/PrenominaApi/`

## Estructura de Componentes (OBLIGATORIO)
```
component/
├── component.component.html
├── component.component.scss
└── component.component.ts
```

## Angular - Reglas OBLIGATORIAS

### Signal APIs (NO usar decoradores legacy)
```typescript
// USAR:
public readonly item = input<Type>();
public readonly onChange = output<Event>();
public readonly element = viewChild<ElementRef>('ref');
public readonly state = signal(false);
effect(() => { /* reaccionar a cambios */ });

// NO USAR: @Input(), @Output(), @ViewChild()
```

### Control Flow (NO usar directivas estructurales)
```html
<!-- USAR: -->
@if (condition) { } @else { }
@for (item of items(); track item.id) { }

<!-- NO USAR: *ngIf, *ngFor -->
```

### Decorador de Componente
```typescript
@Component({
    selector: 'app-name',
    templateUrl: './name.component.html',
    styleUrl: './name.component.scss',  // SINGULAR, no styleUrls
    imports: [...],
    // NO usar standalone: true (es default)
})
```

### Animaciones
```typescript
import { appAnimations } from '@core/animations';
@Component({ animations: appAnimations })
```

### Cleanup de Suscripciones
```typescript
private readonly destroy$ = new Subject<void>();
ngOnDestroy() { this.destroy$.next(); this.destroy$.complete(); }
```

## Comandos
- Build: `npm run build`
- Start: `npm run start`

## Contexto Detallado
Ver @CLAUDE_CONTEXT.md para documentación completa del proyecto.
