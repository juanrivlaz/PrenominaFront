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

# UI/UX Requirements

For every task involving:
- UI design
- UX improvements
- Frontend development
- React components
- Vue components
- Angular components
- Tailwind CSS
- Mobile interfaces
- Responsive layouts

Always apply the frontend-design skill before generating code.

Requirements:
- Modern SaaS design
- Mobile-first
- WCAG AA accessibility
- Responsive design
- Consistent spacing using 8px grid
- Clear visual hierarchy
- Loading states
- Empty states
- Error states
- Dark mode support
- Use shadcn/ui components when possible
- Use Tailwind CSS best practices

Never generate generic UI.
Always explain UX decisions when significant layout changes are made.