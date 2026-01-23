import { CommonModule } from "@angular/common";
import { Component, inject, model, OnInit, ViewEncapsulation } from "@angular/core";
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
import { MatSnackBar } from "@angular/material/snack-bar";
import { AppConfigService } from "@core/services/app-config/app-config.service";
import { MatTableDataSource, MatTableModule } from "@angular/material/table";
import { ITabulator } from "@core/models/tabulator.interface";
import { TypeApplyIgnoreIncident } from "@core/models/enum/type-apply-ignore-incident";

@Component({
    selector: 'app-employee-adjustments',
    imports: [CommonModule, MaterialModule, MatTabsModule, MatSlideToggleModule, MatTableModule],
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
    public columnTableTenants: Array<string> = [
        'id',
        'label',
        'actions'
    ];
    public columnTableActivities: Array<string> = [
        'id',
        'label',
        'actions'
    ];
    public columnTableEmployees: Array<string> = [
        'code',
        'name',
        'activity',
        'tenant',
        'actions',
        'block-clock'
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
        ]).pipe(finalize(() => {
            this.configService.setLoading(false);
        })).subscribe({
            next: (response) => {
                this.typeTenant.set(response[0].typeTenant);
                this.incidentCodes.set(response[1]);

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
                this.activities = new MatTableDataSource<ITabulator>(response[2]);

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
        this.service.getEmployee().pipe(finalize(() => {
            this.configService.setLoading(false);
        })).subscribe({
            next: (response) => {
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