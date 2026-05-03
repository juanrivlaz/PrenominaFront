import { CommonModule } from "@angular/common";
import { Component, inject, model, OnInit, signal, ViewEncapsulation } from "@angular/core";
import { MaterialModule } from "@shared/modules/material/material.module";
import { MatTabsModule } from "@angular/material/tabs";
import { MatDialog } from "@angular/material/dialog";
import { SettingIncidentComponent } from "./setting-incident/setting-incident.component";
import { EmployeeAdjustmentsService } from "./employee-adjustments.service";
import { TypeTenant } from "@core/models/enum/type-tenant";
import { AuthService } from "@core/services/auth/auth.service";
import { combineLatest, combineLatestWith, filter, finalize } from "rxjs";
import { IEmployee } from "@core/models/employee.interface";
import { IIncidentCode } from "@core/models/incident-code.interface";
import { ISettingIncident } from "./setting-incident/setting-incident.interface";
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from "@angular/material/snack-bar";
import { AppConfigService } from "@core/services/app-config/app-config.service";
import { MatTableDataSource, MatTableModule } from "@angular/material/table";
import { ITabulator } from "@core/models/tabulator.interface";
import { TypeApplyIgnoreIncident } from "@core/models/enum/type-apply-ignore-incident";
import { IWorkSchedule } from "@core/models/work-schedule.interface";

@Component({
    selector: 'app-employee-adjustments',
    imports: [CommonModule, MaterialModule, MatTabsModule, MatSlideToggleModule, MatSelectModule, MatTableModule],
    providers: [EmployeeAdjustmentsService],
    templateUrl: './employee-adjustments.component.html',
    styleUrl: './employee-adjustments.component.scss',
    encapsulation: ViewEncapsulation.None
})
export class EmployeeAdjustmentsComponent implements OnInit {
    private readonly dialog = inject(MatDialog);
    private readonly _snackBar = inject(MatSnackBar);
    public typeTenant = model<TypeTenant>(TypeTenant.Department);
    public employees: MatTableDataSource<IEmployee> = new MatTableDataSource<IEmployee>([]);
    public incidentCodes = model<Array<IIncidentCode>>([]);
    public tenants: MatTableDataSource<{ id: number | string; label: string;}> = new MatTableDataSource<{id: number | string; label: string;}>([]);
    public activities: MatTableDataSource<ITabulator> = new MatTableDataSource<ITabulator>([]);
    public readonly workSchedules = signal<Array<IWorkSchedule>>([]);
    public columnTableTenants: Array<string> = [
        'id',
        'label',
        'actions'
    ];
    public columnTableActivities: Array<string> = [
        'id',
        'label',
        'actions',
        'exclude-overtime-activity',
        'work-schedule-activity'
    ];
    public columnTableEmployees: Array<string> = [
        'code',
        'name',
        'activity',
        'tenant',
        'actions',
        'block-clock',
        'exclude-overtime',
        'work-schedule-employee'
    ];

    constructor(
        private readonly service: EmployeeAdjustmentsService,
        private readonly authService: AuthService,
        private readonly configService: AppConfigService
    ) {}

    ngOnInit(): void {
        this.getInit();
    }

    public openIncidentsTenant(item: {
        id: number | string;
        label: string;
    }): void {
        this.addIgnoreIncident(item.id.toString(), item.label, TypeApplyIgnoreIncident.Tenant);
    }

    public openIncidentsActivity(item: ITabulator): void {
        this.addIgnoreIncident(item.ocupation.toString(), item.activity, TypeApplyIgnoreIncident.Activity);
    }

    public openIncidentsEmployee(item: IEmployee): void {
        this.addIgnoreIncident(item.codigo.toString(), `${item.name} ${item.lastName} ${item.mLastName}`, TypeApplyIgnoreIncident.Employee);
    }

    public toggleExcludeOvertime(employee: IEmployee, event: any): void {
        const excludeOvertime = event.checked;
        this.service.updateExcludeOvertime(employee.codigo, excludeOvertime).subscribe({
            next: () => {
                (employee as any).excludeOvertime = excludeOvertime;
                this._snackBar.open(
                    excludeOvertime ? 'Empleado excluido de horas extras' : 'Empleado incluido en horas extras',
                    undefined,
                    {
                        horizontalPosition: 'center',
                        verticalPosition: 'top',
                        panelClass: 'alert-success',
                        duration: 3000
                    }
                );
            },
            error: (err) => {
                event.source.checked = !excludeOvertime;
                const message = err.error?.message || 'Error al actualizar configuración';
                this._snackBar.open(message, undefined, {
                    horizontalPosition: 'center',
                    verticalPosition: 'top',
                    panelClass: 'alert-error',
                    duration: 3000
                });
            }
        });
    }

    public toggleBlockClock(employee: IEmployee, event: any): void {
        const blocked = event.checked;
        this.service.updateBlockOnClocks(employee.codigo, blocked).subscribe({
            next: () => {
                employee.isBlockedOnClocks = blocked;
                this._snackBar.open(
                    blocked ? 'Empleado bloqueado en todos los relojes' : 'Empleado desbloqueado en todos los relojes',
                    undefined,
                    {
                        horizontalPosition: 'center',
                        verticalPosition: 'top',
                        panelClass: 'alert-success',
                        duration: 3000
                    }
                );
            },
            error: (err) => {
                event.source.checked = !blocked;
                const message = err.error?.message || 'No se pudo aplicar el bloqueo en los relojes';
                this._snackBar.open(message, undefined, {
                    horizontalPosition: 'center',
                    verticalPosition: 'top',
                    panelClass: 'alert-error',
                    duration: 5000
                });
            }
        });
    }

    public onChangeActivitySchedule(activity: ITabulator, scheduleId: string | null): void {
        this.service.assignActivitySchedule(activity.ocupation, scheduleId).subscribe({
            next: () => {
                (activity as any).workScheduleId = scheduleId;
                this._snackBar.open('Horario actualizado para la actividad', undefined, {
                    horizontalPosition: 'center',
                    verticalPosition: 'top',
                    panelClass: 'alert-success',
                    duration: 3000
                });
            },
            error: (err) => {
                const message = err.error?.message || 'Error al actualizar horario';
                this._snackBar.open(message, undefined, {
                    horizontalPosition: 'center',
                    verticalPosition: 'top',
                    panelClass: 'alert-error',
                    duration: 3000
                });
            }
        });
    }

    public onChangeEmployeeSchedule(employee: IEmployee, scheduleId: string | null): void {
        this.service.assignEmployeeSchedule(employee.codigo, scheduleId).subscribe({
            next: () => {
                (employee as any).workScheduleId = scheduleId;
                this._snackBar.open('Horario actualizado para el empleado', undefined, {
                    horizontalPosition: 'center',
                    verticalPosition: 'top',
                    panelClass: 'alert-success',
                    duration: 3000
                });
            },
            error: (err) => {
                const message = err.error?.message || 'Error al actualizar horario';
                this._snackBar.open(message, undefined, {
                    horizontalPosition: 'center',
                    verticalPosition: 'top',
                    panelClass: 'alert-error',
                    duration: 3000
                });
            }
        });
    }

    public toggleExcludeOvertimeActivity(activity: ITabulator, event: any): void {
        const excludeOvertime = event.checked;
        this.service.updateExcludeOvertimeActivity(activity.ocupation, excludeOvertime).subscribe({
            next: () => {
                (activity as any).excludeOvertime = excludeOvertime;
                this._snackBar.open(
                    excludeOvertime ? 'Actividad excluida de horas extras' : 'Actividad incluida en horas extras',
                    undefined,
                    {
                        horizontalPosition: 'center',
                        verticalPosition: 'top',
                        panelClass: 'alert-success',
                        duration: 3000
                    }
                );
            },
            error: (err) => {
                event.source.checked = !excludeOvertime;
                const message = err.error?.message || 'Error al actualizar configuración';
                this._snackBar.open(message, undefined, {
                    horizontalPosition: 'center',
                    verticalPosition: 'top',
                    panelClass: 'alert-error',
                    duration: 3000
                });
            }
        });
    }

    public handleChangeSearch(event: Event): void {
        const filterValue = (event.target as HTMLInputElement).value;
        this.activities.filter = filterValue.trim().toLowerCase();
        this.employees.filter = filterValue.trim().toLowerCase();
    }

    private addIgnoreIncident(id: string, name: string, type: TypeApplyIgnoreIncident): void {
        const dialogRef = this.dialog.open<SettingIncidentComponent, ISettingIncident>(SettingIncidentComponent, {
            data: {
                incidentCodes: this.incidentCodes(),
                name,
                type,
                service: this.service,
                id: TypeApplyIgnoreIncident.Employee || TypeApplyIgnoreIncident.Activity ? parseInt(id, 10) : id,
            }
        });

        dialogRef.afterClosed().subscribe((result?: Array<IIncidentCode & { ignore: boolean }>) => {
            if (result) {
                const parseResult = result.map((item) => ({
                    code: item.code,
                    ignore: item.ignore,
                }));

                let event = this.service.addIgnoreIncidentToTenant(id, parseResult);
                if (type === TypeApplyIgnoreIncident.Employee) {
                    event = this.service.addIgnoreIncidentToEmployee(parseInt(id, 10), parseResult);
                } else if (type === TypeApplyIgnoreIncident.Activity) {
                    event = this.service.addIgnoreIncidentToActivity(parseInt(id, 10), parseResult);
                }

                event.subscribe({
                    next: () => {
                        this._snackBar.open('Ajustes de Incidencias Actualizadas', '✅', {
                            horizontalPosition: 'center',
                            verticalPosition: 'top',
                            panelClass: 'alert-success',
                            duration: 3000
                        });
                    },
                    error: (err) => {
                        const message = err.error?.message || 'Ocurrió un error, por favor intentalo más tarde';

                        this._snackBar.open(message, '❌', {
                            horizontalPosition: 'center',
                            verticalPosition: 'top',
                            panelClass: 'alert-success',
                            duration: 3000
                        });
                    }
                });
            }
        });
    }

    private subscriptionEmployees(): void {
        this.authService.activeCompany.pipe(
            combineLatestWith(this.authService.activeTenant),
            filter(([company, tenant]) => !!company && !!tenant),
        ).subscribe(() => {
            this.getEmployees();
        });
    }

    private getInit(): void {
        this.configService.setLoading(true);
        combineLatest([
            this.service.getTenants(),
            this.service.getIncidentCodes(),
            this.service.getActivities(),
            this.service.getExcludedActivities(),
            this.service.getWorkSchedules(),
            this.service.getActivityScheduleConfigs(),
        ]).pipe(finalize(() => {
            this.configService.setLoading(false);
        })).subscribe({
            next: (response) => {
                this.typeTenant.set(response[0].typeTenant);
                this.incidentCodes.set(response[1]);

                const excludedActivityIds = new Set(response[3]);
                this.workSchedules.set(response[4]);
                const activityScheduleConfigs = response[5] || {};

                let itemsActivities = [];
                if (response[0].typeTenant === TypeTenant.Department) {
                    itemsActivities = (response[0].centers || []).map((item) => ({
                        id: item.id,
                        label: item.departmentName || ''
                    }));
                } else {
                    itemsActivities = (response[0].supervisors || []).map((item) => ({
                        id: item.id,
                        label: item.name || ''
                    }));
                }

                this.tenants = new MatTableDataSource<{id: number | string; label: string;}>(itemsActivities);

                const activitiesWithConfig = response[2].map((a: ITabulator) => ({
                    ...a,
                    excludeOvertime: excludedActivityIds.has(a.ocupation),
                    workScheduleId: activityScheduleConfigs[a.ocupation]?.workScheduleId ?? null
                }));
                this.activities = new MatTableDataSource<ITabulator>(activitiesWithConfig);

                this.subscriptionEmployees();
            },
            error: (err) => {
                const message = err.error?.message || 'Ocurrió un error, por favor intentalo más tarde';

                this._snackBar.open(message, '❌', {
                  horizontalPosition: 'center',
                  verticalPosition: 'top',
                  panelClass: 'alert-error',
                  duration: 3000
                });
            }
        });
    }

    private getEmployees(): void {
        this.configService.setLoading(true);
        combineLatest([
            this.service.getEmployee(),
            this.service.getExcludedEmployees(),
            this.service.getEmployeeScheduleAssignments(),
            this.service.getBlockedEmployees(),
        ]).pipe(finalize(() => {
            this.configService.setLoading(false);
        })).subscribe({
            next: ([response, excludedCodes, assignments, blockedCodes]) => {
                const excludedSet = new Set(excludedCodes);
                const blockedSet = new Set(blockedCodes);
                const assignmentMap = assignments || {};
                response.items.forEach((e: any) => {
                    e.excludeOvertime = excludedSet.has(e.codigo);
                    e.workScheduleId = assignmentMap[e.codigo]?.workScheduleId ?? null;
                    e.isBlockedOnClocks = blockedSet.has(e.codigo);
                });
                this.employees = new MatTableDataSource(response.items);
            },
            error: (err) => {
                const message = err.error?.message || 'Ocurrió un error, por favor intentalo más tarde';

                this._snackBar.open(message, '❌', {
                  horizontalPosition: 'center',
                  verticalPosition: 'top',
                  panelClass: 'alert-error',
                  duration: 3000
                });
            }
        });
    }
}