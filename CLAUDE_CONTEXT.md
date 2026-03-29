# Contexto del Proyecto Prenomina

Este documento contiene el contexto completo del proyecto para acelerar futuras consultas con Claude.

---

## Resumen del Proyecto

**Prenomina** es un sistema de gestión de nómina y asistencia de empleados compuesto por:
- **Frontend**: Angular 20.3.16 (SSR habilitado)
- **Backend**: .NET 8.0 Web API con Entity Framework Core
- **Base de datos**: SQL Server

---

## Estructura del Frontend (Angular)

### Ubicación
```
/Users/jrivera/Develop/WebApps/Apsi/NewVersion/front/Prenomina/
```

### Estructura de Carpetas
```
src/app/
├── core/                    # Servicios, guards, interceptors, modelos
│   ├── animations.ts        # Animaciones compartidas (appAnimations)
│   ├── directives/          # Directivas personalizadas
│   ├── guards/              # Guards de rutas
│   ├── interceptors/        # HTTP interceptors
│   ├── models/              # Interfaces y tipos
│   │   └── reports/         # Interfaces de reportes
│   └── services/            # Servicios globales
├── features/                # Módulos de características
│   ├── attendace/           # Gestión de asistencia
│   ├── auth/                # Autenticación (login)
│   ├── clocks/              # Gestión de relojes checadores
│   ├── period/              # Gestión de períodos
│   ├── reports/             # Reportes
│   │   ├── delays-table/
│   │   ├── hours-worked-table/
│   │   ├── attendance-table/
│   │   ├── incidences-table/
│   │   ├── overtimes-table/
│   │   │   ├── overtime-movement-dialog/
│   │   │   └── overtime-history-dialog/
│   │   └── reports.service.ts
│   ├── settings/            # Configuración
│   └── sunday-bonus/        # Prima dominical
└── shared/                  # Componentes compartidos
    ├── components/
    │   ├── avatar/
    │   ├── navbar/
    │   ├── navigation/
    │   │   ├── nav-collapse/
    │   │   ├── nav-group/
    │   │   └── nav-item/
    │   └── toolbar/
    ├── interfaces/
    └── modules/
        └── material/        # Módulo de Angular Material
```

### Convenciones de Componentes

**Estructura de archivos obligatoria:**
```
component-name/
├── component-name.component.html
├── component-name.component.scss
└── component-name.component.ts
```

Si requiere servicio:
```
component-name/
├── component-name.component.html
├── component-name.component.scss
├── component-name.component.ts
└── component-name.service.ts
```

### Patrones de Angular Modernos (Angular 17+)

**Signal-based APIs (OBLIGATORIO):**
```typescript
// Inputs
public readonly item = input<MenuInterface | undefined>(undefined);

// Outputs
public readonly onPageChange = output<PageEvent>();

// ViewChild
public readonly paginator = viewChild<MatPaginator>(MatPaginator);

// Estado interno
public readonly loading = signal(false);

// Valores computados
public readonly label = computed(() => this.name().split(" ").map(w => w[0]).join(""));

// Reaccionar a cambios (reemplaza ngOnChanges)
constructor() {
    effect(() => {
        const value = this.someInput();
        // lógica reactiva
    });
}
```

**Control Flow (OBLIGATORIO):**
```html
<!-- En lugar de *ngIf -->
@if (condition) {
    <div>contenido</div>
} @else {
    <div>alternativo</div>
}

<!-- En lugar de *ngFor -->
@for (item of items(); track item.id) {
    <div>{{ item.name }}</div>
}
```

**Decorador de Componente:**
```typescript
@Component({
    selector: 'app-component-name',
    templateUrl: './component-name.component.html',
    styleUrl: './component-name.component.scss',  // singular, no styleUrls
    imports: [CommonModule, MaterialModule, ...],
    // NO usar standalone: true (es default en Angular 17+)
})
```

### Configuración de Animaciones
```typescript
// app.config.ts
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

// Usar en componentes
import { appAnimations } from '@core/animations';

@Component({
    animations: appAnimations,
})
```

### Manejo de Suscripciones
```typescript
private readonly destroy$ = new Subject<void>();

ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
}

// Uso
this.service.getData()
    .pipe(
        finalize(() => this.loading.set(false)),
        takeUntil(this.destroy$)
    )
    .subscribe({...});
```

---

## Estructura del Backend (.NET)

### Ubicación
```
/Users/jrivera/Develop/WebApps/PrenominaApi/PrenominaApi/
```

### Estructura de Carpetas
```
PrenominaApi/
├── Controllers/             # Controladores API
├── Data/                    # DbContext
│   └── PrenominaDbContext.cs
├── Filters/                 # Filtros de acción
│   └── CompanyTenantValidationFilter.cs
├── Middlewares/             # Middleware personalizado
├── Migrations/              # Scripts SQL de migración
├── Models/
│   ├── Dto/
│   │   ├── GlobalPropertyService.cs
│   │   ├── Input/           # DTOs de entrada
│   │   └── Output/          # DTOs de salida
│   └── Prenomina/           # Entidades de EF Core
│       └── Enums/
├── Repositories/            # Repositorios genéricos
└── Services/
    └── Prenomina/           # Servicios de negocio
```

### Patrones de Controllers

**Obtener CompanyId y Tenant:**
```csharp
private int GetCompanyId()
{
    var company = HttpContext.Items["companySelected"]?.ToString() ?? "0";
    return int.Parse(company);
}

private string GetTenant()
{
    return HttpContext.Items["tenantSelected"]?.ToString() ?? "";
}
```

**UserId (GUID):**
```csharp
// GlobalPropertyService.UserId es string?
// Convertir a Guid cuando se necesite:
Guid.Parse(userId ?? Guid.Empty.ToString())
```

**Decoradores de Controller:**
```csharp
[Route("api/[controller]"), Authorize]
[ServiceFilter(typeof(CompanyTenantValidationFilter))]
[ApiController]
public class MyController : ControllerBase
```

### Tipos de IDs
- **User.Id**: `Guid`
- **CompanyId**: `int`
- **EmployeeCode (Codigo)**: `decimal` en DB, convertir a `int` cuando se necesite

### GlobalPropertyService
```csharp
public class GlobalPropertyService
{
    public int YearOfOperation { get; set; }
    public TypeTenant TypeTenant { get; set; }  // Department o Supervisor
    public string? UserId { get; set; }
}
```

---

## Modelos de Datos Clave

### Entidades Principales
- **User**: Usuario del sistema (Id: Guid)
- **Key**: Empleado/Trabajador (Codigo: decimal)
- **Period**: Período de nómina
- **AttendanceRecords**: Registros de asistencia
- **AssistanceIncident**: Incidencias de asistencia
- **OvertimeAccumulation**: Balance de horas extras
- **OvertimeMovementLog**: Log de movimientos de horas extras

### Tipos de Movimiento de Horas Extra
```csharp
public enum OvertimeMovementType
{
    Accumulation = 1,      // Acumulación
    UsedForRestDay = 2,    // Usado para día de descanso
    DirectPayment = 3,     // Pago directo
    ManualAdjustment = 4,  // Ajuste manual
    Cancellation = 5       // Cancelación
}
```

---

## Interfaces TypeScript Importantes

### Reportes de Horas Extra
```typescript
// overtime-accumulation.interface.ts
interface IOvertimeSummary {
    employeeCode: number;
    fullName: string;
    department: string;
    totalOvertimeMinutes: number;
    totalOvertimeFormatted: string;
    currentBalance: number;
    currentBalanceFormatted: string;
    pendingMinutes: number;
    dayDetails: IOvertimeDayDetail[];
}

interface IOvertimeDayDetail {
    date: string;
    checkIn: string;
    checkOut: string;
    overtimeMinutes: number;
    overtimeFormatted: string;
    status: OvertimeDayStatus;
    statusLabel: string;
    movementId?: number;
}

enum OvertimeDayStatus {
    Pending = 0,
    Accumulated = 1,
    Paid = 2,
    Cancelled = 3
}
```

---

## Servicios de API

### Endpoints de Horas Extra
```
GET  /api/overtime-accumulation/summary?typeNomina={}&numPeriod={}
GET  /api/overtime-accumulation/balance/{employeeCode}
GET  /api/overtime-accumulation/movements?employeeCode={}&page={}&pageSize={}
POST /api/overtime-accumulation/accumulate
POST /api/overtime-accumulation/pay-direct
POST /api/overtime-accumulation/use-for-rest-day
POST /api/overtime-accumulation/adjust
POST /api/overtime-accumulation/cancel
POST /api/overtime-accumulation/process-batch
```

---

## Base de Datos

### Tablas de Horas Extra
```sql
-- overtime_accumulations
CREATE TABLE overtime_accumulations (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    employee_code INT NOT NULL,
    company_id INT NOT NULL,
    accumulated_minutes INT NOT NULL DEFAULT 0,
    used_minutes INT NOT NULL DEFAULT 0,
    paid_minutes INT NOT NULL DEFAULT 0,
    created_at DATETIME2,
    updated_at DATETIME2
);

-- overtime_movement_logs
CREATE TABLE overtime_movement_logs (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    overtime_accumulation_id INT NOT NULL,
    employee_code INT NOT NULL,
    company_id INT NOT NULL,
    movement_type INT NOT NULL,
    minutes INT NOT NULL,
    balance_after INT NOT NULL,
    source_date DATE NOT NULL,
    applied_rest_date DATE NULL,
    original_check_in TIME NULL,
    original_check_out TIME NULL,
    notes NVARCHAR(500) NULL,
    by_user_id UNIQUEIDENTIFIER NOT NULL,  -- FK a user(id)
    related_movement_id INT NULL,
    created_at DATETIME2
);
```

---

## Dependencias Principales

### Frontend
- Angular 20.3.16
- Angular Material
- RxJS
- dayjs (para manejo de fechas)
- ngx-colors (selector de colores)
- TinyMCE (editor de texto)

### Backend
- .NET 8.0
- Entity Framework Core
- Microsoft.Data.SqlClient
- JWT para autenticación

---

## Notas Importantes

1. **NO usar `standalone: true`** en componentes - es el default en Angular 17+
2. **Usar `styleUrl` (singular)** en lugar de `styleUrls`
3. **Los IDs de Usuario son GUID**, no int
4. **CompanyId y Tenant** se obtienen de `HttpContext.Items`, no de `GlobalPropertyService`
5. **Siempre usar signals** (`input()`, `output()`, `signal()`, `computed()`, `effect()`)
6. **Siempre usar control flow** (`@if`, `@for`, `@switch`) en lugar de directivas estructurales
7. **Archivos de migración SQL** van en `/Migrations/` con nombre descriptivo
8. **La tabla de usuarios se llama `[user]`** (minúscula, con corchetes por ser palabra reservada)

---

## Comandos Útiles

```bash
# Frontend
cd /Users/jrivera/Develop/WebApps/Apsi/NewVersion/front/Prenomina
npm run build
npm run start

# Backend (requiere Windows/Visual Studio para ModelClock.dll)
cd /Users/jrivera/Develop/WebApps/PrenominaApi/PrenominaApi
dotnet build
dotnet run
```

---

## Contacto
Proyecto desarrollado para gestión de prenómina y asistencia de empleados.
