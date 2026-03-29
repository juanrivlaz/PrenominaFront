# Plan de Mejoras - Módulo Overtimes

## Estado actual
El módulo de horas extras vive en `src/app/features/reports/overtimes-table/` con dos diálogos (movement y history), respaldado por `reports.service.ts` y el backend en `OvertimeAccumulationController` / `OvertimeAccumulationService`.

---

## Mejora 1 — Reordenar columnas y agregar "T. Extra Pagado"

**Orden requerido:** Código → Nombre → Departamento → T. Extra Periodo → Balance → Acumulado → Pendiente y Acciones → T. Extra Pagado

### Frontend
- **[overtimes-table.component.html](src/app/features/reports/overtimes-table/overtimes-table.component.html)** — Reordenar `<ng-container matColumnDef>` al nuevo orden y agregar columna `paidOvertime`.
- **[overtimes-table.component.ts](src/app/features/reports/overtimes-table/overtimes-table.component.ts)** — Actualizar array `displayedColumns` para incluir `paidOvertime`.
- **[overtime-accumulation.interface.ts](src/app/core/models/reports/overtime-accumulation.interface.ts)** — Agregar campo `totalPaidMinutes` / `totalPaidFormatted` a `IOvertimeSummary` (si no existe ya como `paidMinutes`). Verificar que el campo mapeado desde el API sea correcto.

### Backend
- **OvertimeAccumulationService.cs** — En `GetOvertimeSummary`, incluir la suma de minutos pagados del periodo actual en el DTO de salida (`PaidMinutes` ya existe, verificar que represente solo el periodo consultado y no el acumulado global).
- **OvertimeSummaryOutput** — Agregar `TotalPaidFormatted` si no existe.

### Archivos a modificar
| Archivo | Cambio |
|---------|--------|
| `overtimes-table.component.html` | Reordenar columnas, agregar columna `paidOvertime` |
| `overtimes-table.component.ts` | Actualizar `displayedColumns` |
| `overtimes-table.component.scss` | Estilos para nueva columna |
| `overtime-accumulation.interface.ts` | Verificar/agregar campo pagado del periodo |
| `OvertimeAccumulationService.cs` | Incluir pagado-del-periodo en summary |

---

## Mejora 2 — Checkbox para acciones masivas por empleado

Agregar un checkbox en cada fila de día (detalle expandido) para poder seleccionar múltiples días y ejecutar acciones masivas (acumular o pagar) sobre la selección.

### Frontend
- **[overtimes-table.component.html](src/app/features/reports/overtimes-table/overtimes-table.component.html)** — Agregar columna `select` con `<mat-checkbox>` en la tabla de detalle (dayColumns). Incluir checkbox "seleccionar todos" en el header.
- **[overtimes-table.component.ts](src/app/features/reports/overtimes-table/overtimes-table.component.ts)** — Agregar `SelectionModel` de CDK para manejar selección. Agregar botones de acción masiva ("Acumular seleccionados", "Pagar seleccionados") que aparecen cuando hay selección activa. Solo permitir seleccionar días con status `Pending`.
- **[overtimes-table.component.scss](src/app/features/reports/overtimes-table/overtimes-table.component.scss)** — Estilos para barra de acciones masivas.

### Backend
- Sin cambios necesarios — el endpoint `process-batch` ya acepta lista de `EmployeeCodes`. Sin embargo, se necesita un nuevo endpoint o modificar el existente para procesar **días específicos** de un solo empleado.
- **Opción A:** Nuevo endpoint `POST /OvertimeAccumulation/process-employee-days` que reciba `employeeCode` + lista de `sourceDates`.
- **Opción B:** Iterar en frontend llamando al endpoint individual por cada día seleccionado.

**Recomendación:** Opción A para mejor rendimiento y atomicidad.

### Archivos a modificar
| Archivo | Cambio |
|---------|--------|
| `overtimes-table.component.html` | Columna checkbox + barra acciones masivas |
| `overtimes-table.component.ts` | SelectionModel, lógica masiva |
| `overtimes-table.component.scss` | Estilos barra masiva |
| `reports.service.ts` | Nuevo método `processEmployeeDays()` |
| `overtime-accumulation.interface.ts` | Nuevo input DTO |
| `OvertimeAccumulationController.cs` | Nuevo endpoint |
| `OvertimeAccumulationService.cs` | Nuevo método de servicio |

---

## Mejora 3 — Configuración "No aplica horas extras" en employee-adjustments

Agregar un toggle en `employee-adjustments.component` para marcar empleados que no aplican horas extras. Si está activo, el empleado se excluye del listado de overtimes.

### Frontend
- **[employee-adjustments.component.html](src/app/features/employee-adjustments/)** — Agregar columna con `<mat-slide-toggle>` para "No aplica T. Extra" en la tabla de empleados.
- **[employee-adjustments.component.ts](src/app/features/employee-adjustments/)** — Método para llamar al API y guardar la configuración.

### Backend
- **Tabla `key` (empleados)** — Agregar columna `exclude_overtime BIT DEFAULT 0` o crear tabla de configuración `employee_settings`.
- **OvertimeAccumulationService.cs** — En `GetOvertimeSummary`, filtrar empleados donde `exclude_overtime = 1`.
- **Nuevo endpoint o usar existente** para actualizar la configuración del empleado.
- **Migración SQL** — Script para agregar columna.

### Archivos a modificar
| Archivo | Cambio |
|---------|--------|
| `employee-adjustments.component.html` | Toggle "No aplica T. Extra" |
| `employee-adjustments.component.ts` | Método save toggle |
| Servicio de employee-adjustments | Nuevo endpoint |
| `OvertimeAccumulationService.cs` | Filtro en summary |
| `Migrations/` | Script SQL nueva columna |

---

## Mejora 4 — Importar registros de horas extras de otro sistema

Permitir agregar registros de horas extras manualmente (provenientes de otro sistema) que no están ligados a checadas del sistema actual.

### Frontend
- **Nuevo diálogo `overtime-manual-entry-dialog`** dentro de `overtimes-table/` — Formulario con: código empleado (autocompletado), fecha, horas y minutos de tiempo extra, notas/referencia del sistema externo.
- **[overtimes-table.component.html](src/app/features/reports/overtimes-table/overtimes-table.component.html)** — Botón "Agregar registro externo" en el header de la tabla.
- **[overtimes-table.component.ts](src/app/features/reports/overtimes-table/overtimes-table.component.ts)** — Método para abrir el diálogo.

### Backend
- **Nuevo endpoint** `POST /OvertimeAccumulation/manual-entry` — Crea un registro de overtime con un flag `is_external = true` o un `source` field.
- **OvertimeAccumulationService.cs** — Nuevo método que crea el registro sin validar contra checadas.
- Considerar nuevo `OvertimeMovementType.ExternalEntry = 6` o reutilizar `ManualAdjustment`.

### Archivos a crear/modificar
| Archivo | Cambio |
|---------|--------|
| `overtime-manual-entry-dialog/` (nuevo) | Componente de diálogo |
| `overtimes-table.component.html` | Botón para abrir diálogo |
| `overtimes-table.component.ts` | Método openManualEntry |
| `reports.service.ts` | Nuevo método `addManualOvertimeEntry()` |
| `overtime-accumulation.interface.ts` | Nuevo input DTO |
| `OvertimeAccumulationController.cs` | Nuevo endpoint |
| `OvertimeAccumulationService.cs` | Nuevo método |

---

## Mejora 5 — Filtro por horas pendientes y horas aplicadas

Agregar filtros para mostrar solo empleados con horas pendientes, solo con horas aplicadas (acumuladas/pagadas), o todos.

### Frontend
- **[overtimes-table.component.html](src/app/features/reports/overtimes-table/overtimes-table.component.html)** — Agregar `<mat-chip-listbox>` o `<mat-button-toggle-group>` con opciones: "Todos", "Pendientes", "Aplicadas".
- **[overtimes-table.component.ts](src/app/features/reports/overtimes-table/overtimes-table.component.ts)** — Signal `activeFilter` y lógica de filtrado en el frontend (filtrar `summaryData` según selección) o pasar como parámetro al API.

**Recomendación:** Filtrar en frontend ya que los datos ya están cargados. Si el volumen de datos es alto, agregar parámetro al API.

### Archivos a modificar
| Archivo | Cambio |
|---------|--------|
| `overtimes-table.component.html` | Toggle group de filtros |
| `overtimes-table.component.ts` | Signal de filtro + computed para datos filtrados |
| `overtimes-table.component.scss` | Estilos del toggle |

---

## Mejora 6 — Nuevo estatus "Horas en Reserva"

Agregar una nueva acción/estatus para marcar horas como "en reserva" — acumuladas pero sin uso específico asignado.

### Sugerencias de label
1. **"Horas en Reserva"** — Claro y profesional
2. **"Reserva de Horas"** — Alternativa formal
3. **"Banco de Horas"** — Término común en gestión de nómina
4. **"Horas Retenidas"** — Indica que están guardadas sin destino

**Recomendación:** **"Banco de Horas"** es el término más reconocido en el ámbito de nómina. Como alternativa más neutral: **"Horas en Reserva"**.

### Frontend
- **[overtime-accumulation.interface.ts](src/app/core/models/reports/overtime-accumulation.interface.ts)** — Agregar `ReservedWithoutUse = 5` (o el número que siga) a `OvertimeDayStatus`.
- **[overtimes-table.component.ts](src/app/features/reports/overtimes-table/overtimes-table.component.ts)** — Agregar estilo/clase para el nuevo estatus.
- **[overtime-movement-dialog.component.ts](src/app/features/reports/overtimes-table/overtime-movement-dialog/)** — Agregar acción `reserve` al diálogo.
- Agregar opción en menú de acciones del empleado.

### Backend
- **OvertimeMovementType** — Agregar `ReservedWithoutUse = 6`.
- **OvertimeDayStatus** — Agregar `Reserved = 4`.
- **OvertimeAccumulationService.cs** — Implementar lógica de reserva (similar a Accumulate pero con tipo diferente).
- **Nuevo endpoint** `POST /OvertimeAccumulation/reserve`.

### Archivos a modificar
| Archivo | Cambio |
|---------|--------|
| `overtime-accumulation.interface.ts` | Nuevo enum value |
| `overtimes-table.component.*` | Nuevo estilo + acción en menú |
| `overtime-movement-dialog.component.*` | Nueva acción `reserve` |
| `OvertimeMovementType.cs` | Nuevo valor enum |
| `OvertimeDayStatus.cs` | Nuevo valor enum |
| `OvertimeAccumulationController.cs` | Nuevo endpoint |
| `OvertimeAccumulationService.cs` | Nuevo método |
| `OvertimeAccumulation.cs` | Nuevo campo `ReservedMinutes` |

---

## Mejora 7 — Corregir cancelación: las horas no regresan a estado inicial

**Bug:** Al cancelar un movimiento, las horas no regresan al estatus `Pending` en el summary.

### Análisis probable
El `CancelMovement` en el backend crea un log de cancelación y ajusta el balance, pero el `GetOvertimeSummary` determina el status del día basándose en si existe un movimiento para esa fecha. Si el movimiento cancelado sigue existiendo, el día no vuelve a `Pending`.

### Fix
- **OvertimeAccumulationService.cs** — En `GetOvertimeSummary`, al determinar el `OvertimeDayStatus`, verificar si el movimiento asociado fue cancelado (`IsCancelled` o tiene un `CancellationMovementId`). Si fue cancelado, el status del día debe ser `Pending` (no `Cancelled`).
- **Alternativa:** Marcar el movimiento original como cancelado en la base de datos (agregar campo `IsCancelled` si no existe) para que el query de summary lo ignore.

### Archivos a modificar
| Archivo | Cambio |
|---------|--------|
| `OvertimeAccumulationService.cs` | Fix en GetOvertimeSummary para ignorar movimientos cancelados |
| Posible migración SQL | Campo `is_cancelled` en `overtime_movement_logs` si no existe |

---

## Mejora 8 — Alerta al cambiar de periodo si hay horas sin procesar

### Frontend
- **[reports.component.ts](src/app/features/reports/reports.component.ts)** — Antes de ejecutar `setPeriod()`, verificar si hay empleados con horas pendientes en el periodo actual. Si los hay, mostrar diálogo de confirmación.
- **Nuevo diálogo o usar `MatDialog.open` con template inline** — Mensaje: "Existen empleados con horas extras sin procesar. ¿Desea continuar?" con botones "Continuar" (aplica cambio de periodo) y "Cancelar" (cierra alerta sin cambiar).
- **[reports.service.ts](src/app/features/reports/reports.service.ts)** — Método para verificar si existen pendientes: `checkPendingOvertimes(typeNomina, numPeriod)` → retorna boolean o count.

### Backend
- **Nuevo endpoint** `GET /OvertimeAccumulation/has-pending?typeNomina={}&numPeriod={}` — Retorna `{ hasPending: true, count: 5 }`.
- **OvertimeAccumulationService.cs** — Query simple que cuenta empleados con horas pendientes.

### Archivos a modificar
| Archivo | Cambio |
|---------|--------|
| `reports.component.ts` | Lógica de verificación antes de cambiar periodo |
| `reports.component.html` | Posible template de diálogo inline |
| `reports.service.ts` | Nuevo método `checkPendingOvertimes()` |
| `OvertimeAccumulationController.cs` | Nuevo endpoint |
| `OvertimeAccumulationService.cs` | Nuevo método de consulta |

---

## Mejora 9 — Input de horas y minutos en lugar de solo minutos

### Frontend
- **[overtime-movement-dialog.component.html](src/app/features/reports/overtimes-table/overtime-movement-dialog/overtime-movement-dialog.component.html)** — Reemplazar input de `minutesToUse` por dos inputs: `hours` y `minutes`. Usar `<mat-form-field>` con suffix "hrs" / "min".
- **[overtime-movement-dialog.component.ts](src/app/features/reports/overtimes-table/overtime-movement-dialog/overtime-movement-dialog.component.ts)** — Dos FormControls (`hours` y `minutes`). Calcular total en minutos al enviar: `(hours * 60) + minutes`. Validar que el total no exceda el balance. Precargar valores desde `data.minutes` (ej: 150 min → 2 hrs 30 min).
- Aplicar mismo cambio donde se use input de minutos (manual-entry si aplica).

### Archivos a modificar
| Archivo | Cambio |
|---------|--------|
| `overtime-movement-dialog.component.html` | Dos inputs (horas + minutos) |
| `overtime-movement-dialog.component.ts` | FormControls + conversión |
| `overtime-movement-dialog.component.scss` | Estilos layout horizontal |

---

## Mejora 10 — Funcionalidad de búsqueda en listado de empleados

Actualmente el input de búsqueda en `reports.component` pasa el valor al API. Se necesita que también filtre el listado local.

### Frontend
- **[overtimes-table.component.ts](src/app/features/reports/overtimes-table/overtimes-table.component.ts)** — Recibir `input()` de search term desde reports.component. Crear un `computed()` que filtre `summaryData` por código, nombre o departamento.
- **[overtimes-table.component.html](src/app/features/reports/overtimes-table/overtimes-table.component.html)** — Usar el computed filtrado como datasource en lugar del signal directo.
- **[reports.component.ts](src/app/features/reports/reports.component.ts)** — Pasar el search term al componente de overtimes via binding.

### Archivos a modificar
| Archivo | Cambio |
|---------|--------|
| `overtimes-table.component.ts` | Input de búsqueda + computed filtrado |
| `overtimes-table.component.html` | Usar datasource filtrado |
| `reports.component.html` | Binding de search term |

---

## Orden de implementación sugerido

| Prioridad | Mejora | Razón |
|-----------|--------|-------|
| 1 | **#7** Bug fix cancelación | Corrige funcionalidad rota existente |
| 2 | **#1** Reordenar columnas + T. Extra Pagado | Cambio estructural base para las demás mejoras |
| 3 | **#9** Input horas/minutos | Mejora UX rápida, sin dependencias |
| 4 | **#10** Filtro de búsqueda | Mejora UX rápida |
| 5 | **#5** Filtro pendientes/aplicadas | Complementa #10 |
| 6 | **#2** Checkbox acciones masivas | Requiere endpoint backend nuevo |
| 7 | **#8** Alerta cambio de periodo | Requiere endpoint backend nuevo |
| 8 | **#3** Config "No aplica T. Extra" | Requiere migración DB |
| 9 | **#6** Nuevo estatus "Horas en Reserva" | Requiere cambios en enums y lógica |
| 10 | **#4** Importar registros externos | Feature más compleja, nuevo diálogo + endpoint |

---

## Notas
- Cada mejora que toca backend necesita: endpoint + servicio + posible migración SQL.
- Todas las mejoras de frontend siguen las convenciones de Angular 17+ (signals, control flow, `styleUrl` singular).
- Los diálogos nuevos siguen la estructura existente de `overtime-movement-dialog`.
