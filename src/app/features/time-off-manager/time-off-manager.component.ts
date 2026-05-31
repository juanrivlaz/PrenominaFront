import { CommonModule } from "@angular/common";
import { Component, inject, model, OnInit, OnDestroy, signal, ViewEncapsulation, WritableSignal } from "@angular/core";
import { AvatarComponent } from "../../shared/components/avatar/avatar.component";
import { MaterialModule } from "../../shared/modules/material/material.module";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatMenuModule } from "@angular/material/menu";
import { MatDialog } from "@angular/material/dialog";
import { AssignTimeOffComponent } from "./assign-time-off/assign-time-off.component";
import { IAssignTimeOff } from "./assign-time-off/assign-time-off.interface";
import { AttendaceService } from "../attendace/attendace.service";
import { AuthService } from "@core/services/auth/auth.service";
import { combineLatest, debounceTime, finalize, Subject, switchMap, takeUntil, timer, of } from "rxjs";
import { MatSnackBar } from "@angular/material/snack-bar";
import { IPayroll } from "@core/models/payroll.interface";
import { IPrenominaPeriod } from "@core/models/prenomina-period.interface";
import { IIncidentCode } from "@core/models/incident-code.interface";
import dayjs from "dayjs";
import { IEmployee } from "@core/models/employee.interface";
import { TimeOffManagerService } from "./time-off-manager.service";
import { AppConfigService } from "@core/services/app-config/app-config.service";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { MatPaginatorModule, PageEvent } from "@angular/material/paginator";
import { SysKey } from "@core/models/enum/sys-key";
import { IAssignTimeOffOutput } from "./assign-time-off/assign-time-off-output.interface";
import { RejectTimeOffComponent } from "./reject-time-off/reject-time-off.component";
import { IRejectTimeOff, IRejectTimeOffOutput } from "./reject-time-off/reject-time-off.interface";

@Component({
    selector: 'app-time-off-manager',
    imports: [
        CommonModule,
        MaterialModule,
        MatMenuModule,
        MatTooltipModule,
        AvatarComponent,
        ReactiveFormsModule,
        MatPaginatorModule
    ],
    providers: [AttendaceService, TimeOffManagerService],
    templateUrl: './time-off-manager.component.html',
    styleUrl: './time-off-manager.component.scss',
    encapsulation: ViewEncapsulation.None,
})
export class TimeOffManagerComponent implements OnInit, OnDestroy {
    private readonly _snackBar = inject(MatSnackBar);
    private readonly dialog = inject(MatDialog);

    // Subject para cleanup de subscripciones - PREVIENE MEMORY LEAKS
    private readonly destroy$ = new Subject<void>();

    // Subject para cancelar requests anteriores
    private readonly searchTrigger$ = new Subject<string>();

    private _listPeriods: WritableSignal<Array<IPrenominaPeriod>> = signal([]);
    public loading: WritableSignal<boolean> = signal(true);
    public selectedEmployee?: number;
    public initialItem?: number;
    public endItem?: number;
    public itemsTouches: Array<number> = [];
    public timeOff = model<IAssignTimeOff>();
    public listPayrolls: WritableSignal<Array<IPayroll>> = signal([]);
    public listIncidentCodes: WritableSignal<Array<IIncidentCode>> = signal([]);
    public listIncidentCodesAditional: WritableSignal<Array<IIncidentCode>> = signal([]);
    public activePayroll: WritableSignal<number> = signal(0);
    public activePeriod: WritableSignal<number> = signal(0);
    public listEmployees: WritableSignal<Array<IEmployee>> = signal([]);
    public listDates: WritableSignal<Array<{
        day: string,
        date: string,
        label: string,
        key: number,
    }>> = signal([]);
    public attendancesIncidents: Map<string, string> = new Map<string, string>();
    public rejectedIncidents: Map<string, string> = new Map<string, string>();
    public incidentGroups: Map<string, Array<string>> = new Map<string, Array<string>>();
    public searchControl = new FormControl();
    public paginatorDetails: WritableSignal<{
        totalRecord: number;
        pageSize: number;
        page: number;
    }> = signal({
        totalRecord: 0,
        pageSize: 30,
        page: 1
    });

    constructor(
        private readonly service: TimeOffManagerService,
        private readonly serviceAttendace: AttendaceService,
        private readonly authService: AuthService,
        private readonly configService: AppConfigService
    ) {}

    ngOnInit(): void {
        // Usar takeUntil para limpieza automática
        combineLatest([this.authService.activeCompany, this.authService.activeTenant])
            .pipe(takeUntil(this.destroy$))
            .subscribe(() => {
                this.getInit();
            });

        // Configurar búsqueda con switchMap para cancelar requests anteriores
        this.searchTrigger$
            .pipe(
                debounceTime(800),
                switchMap((search) => {
                    if (!this.activePayroll()) {
                        return of(null);
                    }
                    this.configService.setLoading(true);
                    return this.service.getEmployeeByPayroll(
                        this.activePayroll(),
                        this.paginatorDetails().page,
                        search || '',
                        this.activePeriod()
                    ).pipe(
                        finalize(() => this.configService.setLoading(false))
                    );
                }),
                takeUntil(this.destroy$)
            )
            .subscribe({
                next: (response) => {
                    if (response) {
                        this.listEmployees.set(response.items);
                        const listAttendaceIncidents = response.items
                            .map((employee) => employee.attendancesIncident.map((ai) => ({
                                key: `${employee.codigo}:${ai.date}`,
                                code: ai.incidentCode,
                                rejected: ai.rejected,
                                requestGroupId: ai.requestGroupId,
                                date: String(ai.date),
                                employeeCode: employee.codigo,
                            })))
                            .flat();
                        this.attendancesIncidents = new Map(listAttendaceIncidents.map((item) => [item.key, item.code]));
                        this.rejectedIncidents = new Map<string, string>();
                        for (const item of listAttendaceIncidents) {
                            if (item.rejected) {
                                const ai = response.items
                                    .find(e => e.codigo === item.employeeCode)
                                    ?.attendancesIncident.find(a => String(a.date) === item.date);
                                this.rejectedIncidents.set(item.key, ai?.rejectionComment || '');
                            }
                        }

                        this.incidentGroups = new Map<string, Array<string>>();
                        const groupMap = new Map<string, Array<string>>();
                        for (const item of listAttendaceIncidents) {
                            if (item.requestGroupId) {
                                const groupKey = `${item.employeeCode}:${item.requestGroupId}`;
                                if (!groupMap.has(groupKey)) {
                                    groupMap.set(groupKey, []);
                                }
                                groupMap.get(groupKey)!.push(item.date);
                            }
                        }
                        for (const item of listAttendaceIncidents) {
                            if (item.requestGroupId) {
                                const groupKey = `${item.employeeCode}:${item.requestGroupId}`;
                                this.incidentGroups.set(item.key, groupMap.get(groupKey)!);
                            }
                        }
                        this.paginatorDetails.set({
                            totalRecord: response.totalRecords,
                            pageSize: response.pageSize,
                            page: this.paginatorDetails().page
                        });
                    }
                },
                error: (err) => {
                    this.showError(err.error?.message || 'Ocurrió un error, por favor intentalo más tarde');
                }
            });

        // Conectar searchControl al searchTrigger
        this.searchControl.valueChanges
            .pipe(
                debounceTime(400),
                takeUntil(this.destroy$)
            )
            .subscribe((value) => {
                this.searchTrigger$.next(value || '');
            });

        const storageTypeNom = window.localStorage.getItem(SysKey.ActiveTypeNom);
        if (storageTypeNom) {
            this.setPayroll(parseInt(storageTypeNom, 10));
        }

        const storageNumPeriod = window.localStorage.getItem(SysKey.ActiveNumPeriod);
        if (storageNumPeriod) {
            // Usar timer de RxJS en lugar de setTimeout
            timer(800)
                .pipe(takeUntil(this.destroy$))
                .subscribe(() => {
                    this.setPeriod(parseInt(storageNumPeriod, 10));
                });
        }
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    public getInit(): void {
        this.configService.setLoading(true);
        this.serviceAttendace.getInit()
            .pipe(
                finalize(() => this.configService.setLoading(false)),
                takeUntil(this.destroy$)
            )
            .subscribe({
                next: (response) => {
                    this.listPayrolls.set(response.payrolls);
                    this._listPeriods.set(response.periods);
                    // Filtra incidencias disponibles para permisos. Sólo muestra aquellas cuyo label
                    // contenga la palabra "permiso" (con o sin goce). Las demás (vacaciones, castigos,
                    // incapacidades, etc.) se manejan en otros flujos.
                    this.listIncidentCodes.set(response.incidentCodes.filter((item) =>
                        !item.isAdditional &&
                        item.availableForTimeOff &&
                        (item.label || '').toLowerCase().includes('permiso')
                    ));
                    this.listIncidentCodesAditional.set(response.incidentCodes.filter((item) => item.isAdditional && item.availableForTimeOff));
                },
                error: (err) => {
                    this.showError(err.error?.message || 'Ocurrió un error, por favor intentalo más tarde');
                }
            });
    }

    public getEmployee(search: string = ''): void {
        this.searchTrigger$.next(search || this.searchControl.value || '');
    }

    public handleClickDay(id: number, employeeId: number): void {
        if (this.initialItem != undefined && employeeId === this.selectedEmployee && this.initialItem <= id) {
            this.endItem = id;
            const findEmployee = this.listEmployees().find((item) => item.codigo === employeeId);
            const findDates = this.listDates().filter((item) => item.key >= this.initialItem! && item.key <= this.endItem!)

            if (findEmployee) {
                const assignTimeOff = {
                    employeeCode: findEmployee.codigo,
                    employeeName: `${findEmployee.name} ${findEmployee.lastName} ${findEmployee.mLastName}`,
                    dates: findDates.map((item) => dayjs(item.date).toDate()),
                    incidentCodes: this.listIncidentCodes(),
                };

                this.assignTimeOff(assignTimeOff);
            }

            return;
        }

        this.initialItem = id;
        this.selectedEmployee = employeeId;
    }

    public handleOverDay(day: number) {
        const initial = this.initialItem!;
        const current = day;
        const newlist = Array.from({ length: current - initial + 1 }, (_, i) => (initial + i));
        this.itemsTouches = newlist;
    }

    public isActive(id: number) {
        return this.itemsTouches.indexOf(id) >= 0;
    }

    public assignTimeOff(assignTimeOff: IAssignTimeOff): void {
        const dialogRef = this.dialog.open<AssignTimeOffComponent, IAssignTimeOff, IAssignTimeOffOutput>(AssignTimeOffComponent, {
            data: assignTimeOff,
        });

        dialogRef.afterClosed()
            .pipe(takeUntil(this.destroy$))
            .subscribe(result => {
                this.initialItem = undefined;
                this.endItem = undefined;
                this.selectedEmployee = undefined;

                if (result !== undefined) {
                    this.configService.setLoading(true);

                    this.service.registerToUser({
                        dates: assignTimeOff.dates.map((item) => dayjs(item).format('YYYY-MM-DD')),
                        employeeCode: assignTimeOff.employeeCode,
                        incidentCode: result.incidentCode,
                        notes: result.notes,
                        requireAbsenceRequest: result.requireAbsenceRequest,
                    })
                    .pipe(
                        finalize(() => this.configService.setLoading(false)),
                        takeUntil(this.destroy$)
                    )
                    .subscribe({
                        next: (resultData) => {
                            const currentEmployees = this.listEmployees().map((item) => {
                                if (item.codigo == resultData.codigo) {
                                    return resultData;
                                }
                                return item;
                            });

                            this.listEmployees.set(currentEmployees);

                            resultData.attendancesIncident.forEach((item) => {
                                const key = `${resultData.codigo}:${item.date}`;
                                this.attendancesIncidents.set(key, item.incidentCode);
                                this.rejectedIncidents.delete(key);
                            });
                        },
                        error: (err) => {
                            this.showError(err.error?.message || 'Ocurrió un error, por favor intentalo más tarde');
                        }
                    });
                }
            });
    }

    public get payroll(): IPayroll | undefined {
        return this.listPayrolls().find((item) => item.typeNom === this.activePayroll());
    }

    public get period(): IPrenominaPeriod | undefined {
        return this.listPeriods.find((item) => item.numPeriod === this.activePeriod());
    }

    public get listPeriods(): Array<IPrenominaPeriod> {
        return this._listPeriods().filter((item) => item.typePayroll === this.activePayroll());
    }

    // Devuelve el periodo activo + los próximos 2 (3 en total) ordenados por numPeriod ascendente.
    public get quickPeriods(): Array<IPrenominaPeriod> {
        const periods = this.listPeriods;
        const activeIndex = periods.findIndex((p) => p.isActive);
        if (activeIndex === -1) return [];
        return periods.slice(activeIndex, activeIndex + 3);
    }

    public setPeriod(id: number, noAlert = false): void {
        this.activePeriod.set(id);

        if (!this.period) {
            if (!noAlert) {
                this.showError('Selecciona un periodo');
            }
            return;
        }

        window.localStorage.setItem(SysKey.ActiveNumPeriod, id.toString());
        this.listDates.set(this.generarFechas(this.period.startAdminDate, this.period.closingAdminDate));
        this.getEmployee();
    }

    public setPayroll(id: number): void {
        if (id === this.activePayroll()) {
            return;
        }

        this.activePayroll.set(id);
        window.localStorage.setItem(SysKey.ActiveTypeNom, id.toString());

        // Usar timer en lugar de setTimeout
        timer(200)
            .pipe(takeUntil(this.destroy$))
            .subscribe(() => {
                this.listDates.set([]);
                this.setPeriod(0, true);
                this.getEmployee();
            });
    }

    public getIncidentForDate(employeeCode: number, date: string) {
        return this.attendancesIncidents.get(`${employeeCode}:${date}`) || '';
    }

    public isRejected(employeeCode: number, date: string): boolean {
        return this.rejectedIncidents.has(`${employeeCode}:${date}`);
    }

    public getRejectionComment(employeeCode: number, date: string): string {
        return this.rejectedIncidents.get(`${employeeCode}:${date}`) || '';
    }

    public rejectTimeOff(employeeCode: number, date: string, event: MouseEvent): void {
        event.preventDefault();
        event.stopPropagation();

        const incidentCode = this.getIncidentForDate(employeeCode, date);
        if (!incidentCode) {
            return;
        }

        if (this.isRejected(employeeCode, date)) {
            const comment = this.getRejectionComment(employeeCode, date);
            this._snackBar.open(
                `Motivo del rechazo: ${comment || 'Sin comentario'}`,
                'Cerrar',
                {
                    horizontalPosition: 'center',
                    verticalPosition: 'top',
                    duration: 6000
                }
            );
            return;
        }

        const employee = this.listEmployees().find((item) => item.codigo === employeeCode);
        if (!employee) {
            return;
        }

        const key = `${employeeCode}:${date}`;
        const groupDates = this.incidentGroups.get(key) || [date];

        const data: IRejectTimeOff = {
            employeeCode,
            employeeName: `${employee.name} ${employee.lastName} ${employee.mLastName}`,
            date,
            incidentCode,
            groupDates,
        };

        const dialogRef = this.dialog.open<RejectTimeOffComponent, IRejectTimeOff, IRejectTimeOffOutput>(RejectTimeOffComponent, {
            data,
            width: '450px',
        });

        dialogRef.afterClosed()
            .pipe(takeUntil(this.destroy$))
            .subscribe(result => {
                if (result) {
                    this.configService.setLoading(true);
                    this.service.rejectDayOff({
                        employeeCode,
                        date,
                        comment: result.comment,
                    })
                    .pipe(
                        finalize(() => this.configService.setLoading(false)),
                        takeUntil(this.destroy$)
                    )
                    .subscribe({
                        next: (rejectedItems) => {
                            rejectedItems.forEach((item) => {
                                this.rejectedIncidents.set(`${employeeCode}:${item.date}`, result.comment);
                            });
                            const count = rejectedItems.length;
                            this._snackBar.open(
                                count > 1 ? `${count} permisos rechazados correctamente` : 'Permiso rechazado correctamente',
                                '✅',
                                {
                                    horizontalPosition: 'center',
                                    verticalPosition: 'top',
                                    panelClass: 'alert-success',
                                    duration: 3000
                                }
                            );
                        },
                        error: (err) => {
                            this.showError(err.error?.message || 'Error al rechazar el permiso');
                        }
                    });
                }
            });
    }

    public syncIncapacity(): void {
        if (!this.period) {
            this.showError('Selecciona un periodo');
            return;
        }

        this.configService.setLoading(true);

        this.service.syncIncapacity({
            TypeNom: this.activePayroll(),
            PeriodId: this.period.id,
            TenantId: this.authService.activeTenant.value
        })
        .pipe(
            finalize(() => this.configService.setLoading(false)),
            takeUntil(this.destroy$)
        )
        .subscribe({
            next: (result) => {
                this._snackBar.open(
                    `Se han sincronizado ${result.totalIncapacities} incapacidades y ${result.totalVacations} vacaciones`,
                    '✅',
                    {
                        horizontalPosition: 'center',
                        verticalPosition: 'top',
                        panelClass: 'alert-success',
                        duration: 3500
                    }
                );
            },
            error: (err) => {
                this.showError(err.error?.message || 'Error al sincronizar');
            }
        });
    }

    public handlePageEvent(e: PageEvent): void {
        this.paginatorDetails.update((state) => ({
            ...state,
            page: e.pageIndex + 1
        }));

        // Triggear búsqueda inmediatamente
        this.searchTrigger$.next(this.searchControl.value || '');
    }

    private showError(message: string): void {
        this._snackBar.open(message, '❌', {
            horizontalPosition: 'center',
            verticalPosition: 'top',
            panelClass: 'alert-error',
            duration: 3000
        });
    }

    private generarFechas(startDate: string | Date, endDate: string | Date): Array<{
        day: string,
        date: string,
        label: string,
        key: number
    }> {
        const dates = [];
        let start = dayjs(startDate);
        const end = dayjs(endDate);

        while (start.isBefore(end) || start.isSame(end)) {
            dates.push({
                day: start.format("ddd").toUpperCase(),
                date: start.format("YYYY-MM-DD"),
                label: start.format("DD/MM/YY"),
                key: dates.length
            });
            start = start.add(1, "day");
        }

        return dates;
    }
}
