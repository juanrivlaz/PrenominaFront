import { ChangeDetectionStrategy, Component, inject, model, OnInit, OnDestroy, signal, ViewEncapsulation, WritableSignal } from "@angular/core";
import { MaterialModule } from "../../shared/modules/material/material.module";
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from "@angular/common";
import { MatDialog } from "@angular/material/dialog";
import { AssignDoubleShiftComponent } from "./assign-double-shift/assign-double-shift.component";
import { IAssignDoubleShift } from "./assign-double-shift/assign-double-shift.interface";
import { AssignWorkedDayOffComponent } from "./assign-worked-day-off/assign-worked-day-off.component";
import { IAssignWorkedDayOff } from "./assign-worked-day-off/assign-worked-day-off.interface";
import { AssignSpecialIncidentComponent } from "./assign-special-incident/assign-special-incident.component";
import { DetailDayComponent } from "./details-day/details-day.component";
import { AttendaceService } from "./attendace.service";
import { combineLatest, debounceTime, finalize, forkJoin, Subject, switchMap, takeUntil, timer, of } from "rxjs";
import { MatSnackBar } from "@angular/material/snack-bar";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { AuthService } from "@core/services/auth/auth.service";
import { IPayroll } from "@core/models/payroll.interface";
import { IEmployeeAttendance } from "@core/models/employee-attendances.interface";
import { IAttendance } from "@core/models/attendance.interface";
import { IIncidentCode } from "@core/models/incident-code.interface";
import { IDetailsDay } from "./details-day/details-day.interface";
import { IAssignSpecialIncident } from "./assign-special-incident/assign-special-incident.interface";
import { IPrenominaPeriod } from "@core/models/prenomina-period.interface";
import dayjs from "dayjs";
import { TypeFileDownload } from "@core/models/enum/type-file-download";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { SysKey } from "@core/models/enum/sys-key";
import { IDayOffs } from "@core/models/day-offs.interface";
import { GeneratedDates } from "@core/models/generated-dates.interface";
import { ConfirmClosePeriodComponent } from "./confirm-close-period/confirm-close-period.component";
import { IConfirmClosePeriod } from "./confirm-close-period/confirm-close-period.interface";
import { IPeriodStatus } from "@core/models/period-status.interface";
import { AppConfigService } from "@core/services/app-config/app-config.service";
import { ChangeAttendanceComponent } from "./change-attendance/change-attendance.component";
import { IChangeAttendance } from "./change-attendance/change-attendance.interface";
import { IChangeAttendanceResponse } from "./change-attendance/change-attendance-response.interface";

@Component({
    selector: 'app-attendace',
    imports: [
        MaterialModule,
        MatMenuModule,
        MatTooltipModule,
        CommonModule,
        MatPaginatorModule,
        MatProgressSpinnerModule,
        MatProgressBarModule,
        ReactiveFormsModule
    ],
    providers: [
        AttendaceService
    ],
    templateUrl: './attendace.component.html',
    styleUrl: './attendace.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None,
})
export class AttendaceComponent implements OnInit, OnDestroy {
    private readonly _snackBar = inject(MatSnackBar);
    private readonly dialog = inject(MatDialog);

    // Subject para cleanup de subscripciones - PREVIENE MEMORY LEAKS
    private readonly destroy$ = new Subject<void>();

    // Subject para cancelar requests anteriores - PREVIENE RACE CONDITIONS
    private readonly searchTrigger$ = new Subject<string>();

    private readonly _listPeriods: WritableSignal<Array<IPrenominaPeriod>> = signal([]);

    // Cache para evitar recálculos
    private dayOffsCache: Map<string, boolean> = new Map();

    public doubleShift = model<IAssignDoubleShift>({
        employeCode: '31',
        employeName: 'Duran Miranda Miguel Angel',
        date: new Date(),
    });
    public workedDayOff = model<IAssignWorkedDayOff>({
        employeCode: '32',
        employeName: 'Rivera Lazaro Juan Daniel',
        date: new Date(),
    });
    public open: boolean = false;
    public incidencia: string = 'N/A';
    public searchControl = new FormControl();
    public loading: WritableSignal<boolean> = signal(true);
    public listPayrolls: WritableSignal<Array<IPayroll>> = signal([]);
    public listPeriodStatus: WritableSignal<Array<IPeriodStatus>> = signal([]);
    public activePeriod: number = 0;
    public activePayroll: number = 0;
    public listEmployeeAttendance: WritableSignal<Array<IEmployeeAttendance>> = signal([]);
    public listIncidentCodes: WritableSignal<Array<IIncidentCode>> = signal([]);
    public listIncidentCodesAditional: WritableSignal<Array<IIncidentCode>> = signal([]);
    public listItemsLoading: WritableSignal<Set<string>> = signal(new Set()); // Usar Set para O(1) lookup
    public listDates: WritableSignal<Array<{
        day: string,
        date: string,
        label: string
    }>> = signal([]);
    public paginatorDetails: WritableSignal<{
        totalRecord: number;
        pageSize: number;
        page: number;
    }> = signal({
        totalRecord: 0,
        pageSize: 30,
        page: 1
    });
    public listDayOffs: Array<IDayOffs> = [];
    public canClosePayrollPeriod: boolean = false;
    public canModifyCheckins: boolean = false;

    constructor(
        private readonly service: AttendaceService,
        private readonly authService: AuthService,
        private readonly configService: AppConfigService,
    ) {}

    ngOnInit(): void {
        // Usar takeUntil para limpieza automática
        combineLatest([this.authService.activeCompany, this.authService.activeTenant])
            .pipe(takeUntil(this.destroy$))
            .subscribe(() => {
                this.getInit();
            });

        // Usar switchMap para cancelar requests anteriores (previene race conditions)
        this.searchTrigger$
            .pipe(
                debounceTime(800),
                switchMap((search) => {
                    if (!this.payroll || !this.period) {
                        return of(null);
                    }
                    this.configService.setLoading(true);
                    return this.service.get(
                        this.paginatorDetails().page,
                        30,
                        this.payroll.typeNom,
                        this.period.numPeriod,
                        search || ''
                    ).pipe(
                        finalize(() => this.configService.setLoading(false))
                    );
                }),
                takeUntil(this.destroy$)
            )
            .subscribe({
                next: (response) => {
                    if (response) {
                        this.listEmployeeAttendance.set(
                            response.items.map((item) => ({
                                ...item,
                                attendances: this.getAttendance(item)
                            }))
                        );
                        this.paginatorDetails.set({
                            pageSize: 30,
                            totalRecord: response.totalRecords,
                            page: this.paginatorDetails().page,
                        });
                    }
                },
                error: (err) => {
                    const message = err.error?.message || 'Ocurrió un error, por favor intentalo más tarde';
                    this.showError(message);
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

        const storageTypeNom = window.sessionStorage.getItem(SysKey.ActiveTypeNom);
        if (storageTypeNom) {
            this.setPayroll(parseInt(storageTypeNom, 10));
        }

        const storageNumPeriod = window.sessionStorage.getItem(SysKey.ActiveNumPeriod);
        if (storageNumPeriod) {
            // Usar timer de RxJS en lugar de setTimeout para cleanup automático
            timer(800)
                .pipe(takeUntil(this.destroy$))
                .subscribe(() => {
                    this.setPeriod(parseInt(storageNumPeriod, 10));
                });
        }

        this.authService.sectionsForAccess
            .pipe(takeUntil(this.destroy$))
            .subscribe((sections) => {
                const role = this.authService.role;
                const sectionTAsistencia = sections.find((item) => item.sectionsCode.includes('tasistencia'));

                this.canClosePayrollPeriod = role === 'sudo' || (sectionTAsistencia !== undefined && sectionTAsistencia.permissions["CanClosePayrollPeriod"] === true);
                this.canModifyCheckins = role === 'sudo' || (sectionTAsistencia !== undefined && sectionTAsistencia.permissions["CanModifyCheckins"] === true);
            });
    }

    ngOnDestroy(): void {
        // Limpiar todas las subscripciones
        this.destroy$.next();
        this.destroy$.complete();
        // Limpiar cache
        this.dayOffsCache.clear();
    }

    public getInit(): void {
        this.loading.set(true);
        forkJoin([this.service.getDayOffs(), this.service.getInit()])
            .pipe(
                finalize(() => this.loading.set(false)),
                takeUntil(this.destroy$)
            )
            .subscribe({
                next: (response) => {
                    this.listPayrolls.set(response[1].payrolls);
                    this._listPeriods.set(response[1].periods);
                    this.listPeriodStatus.set(response[1].periodStatus);
                    this.listIncidentCodes.set(response[1].incidentCodes.filter((item) => !item.isAdditional));
                    this.listIncidentCodesAditional.set(response[1].incidentCodes.filter((item) => item.isAdditional));
                    this.listDayOffs = response[0];
                    // Precalcular cache de días festivos
                    this.buildDayOffsCache();
                },
                error: (err) => {
                    const message = err.error?.message || 'Ocurrió un error, por favor intentalo más tarde';
                    this.showError(message);
                }
            });
    }

    /**
     * Construye cache de días festivos para búsqueda O(1)
     */
    private buildDayOffsCache(): void {
        this.dayOffsCache.clear();
        for (const dayOff of this.listDayOffs) {
            const dateKey = dayjs(dayOff.date).format('MM-DD');
            this.dayOffsCache.set(dateKey, true);
        }
    }

    /**
     * Verifica si una fecha es día festivo usando cache O(1)
     */
    private isDayOff(date: string): boolean {
        const dateKey = dayjs(date).format('MM-DD');
        return this.dayOffsCache.has(dateKey);
    }

    public get closedPeriod(): boolean {
        if (!this.payroll || !this.period) {
            return false;
        }

        const activeTenant = this.authService.activeTenant.value.trim().replace(/\s+/g, '');
        const activeCompany = this.authService.activeCompany.value;

        return this.listPeriodStatus().some(
            (item) => item.typePayroll === this.payroll?.typeNom &&
                item.numPeriod === this.period?.numPeriod &&
                (item.tenantId === '-999' || item.tenantId === activeTenant) &&
                item.companyId === activeCompany
        );
    }

    public get(search: string = ''): void {
        if (!this.payroll) {
            this.showError('Selecciona un tipo de nómina');
            return;
        }

        if (!this.period) {
            this.showError('Selecciona un periodo');
            return;
        }

        const listDates = this.generarFechas(this.period.startDate, this.period.closingDate);
        this.listDates.set(listDates);

        // Usar el subject para triggear la búsqueda (con cancelación automática)
        this.searchTrigger$.next(search || this.searchControl.value || '');
    }

    public handleClickOpen() {
        this.open = !this.open;
    }

    public get payroll(): IPayroll | undefined {
        return this.listPayrolls().find((item) => item.typeNom === this.activePayroll);
    }

    public setPayroll(id: number): void {
        this.activePayroll = id;
        window.sessionStorage.setItem(SysKey.ActiveTypeNom, id.toString());
    }

    public get period(): IPrenominaPeriod | undefined {
        return this.listPeriods.find((item) => item.numPeriod === this.activePeriod);
    }

    public setPeriod(id: number): void {
        this.activePeriod = id;
        window.sessionStorage.setItem(SysKey.ActiveNumPeriod, id.toString());
        this.get();
    }

    public get listPeriods(): Array<IPrenominaPeriod> {
        return this._listPeriods().filter((item) => item.typePayroll === this.activePayroll);
    }

    public getAttendance(employee: IEmployeeAttendance): Array<IAttendance> {
        const dates = this.listDates();
        const attendanceMap = new Map<string, IAttendance>();

        // Indexar asistencias existentes por fecha para O(1) lookup
        if (employee.attendances) {
            for (const att of employee.attendances) {
                attendanceMap.set(att.date, att);
            }
        }

        return dates.map((date) => {
            const attendance = attendanceMap.get(date.date);
            const isDayOff = this.isDayOff(date.date);

            if (attendance) {
                return {
                    ...attendance,
                    label: date.label,
                    day: date.day,
                    isInconsistency: this.isInconsistencyChecks(attendance),
                    isDayOff
                };
            }

            return {
                date: date.date,
                label: date.label,
                day: date.day,
                checkEntry: null,
                checkOut: null,
                incidentCode: 'N/A',
                isDayOff
            };
        });
    }

    public setIncidencia(incidentCode: string, employeeCode: number, company: number, attendance: IAttendance, customValue?: number): void {
        const identifyIncident = `${employeeCode}${company}${attendance.date}`;

        // Usar Set para mejor rendimiento
        this.listItemsLoading.update(items => {
            const newSet = new Set(items);
            newSet.add(identifyIncident);
            return newSet;
        });

        this.service.insertAttendaceIncident(incidentCode, attendance.date, employeeCode, customValue)
            .pipe(
                finalize(() => {
                    this.listItemsLoading.update(items => {
                        const newSet = new Set(items);
                        newSet.delete(identifyIncident);
                        return newSet;
                    });
                }),
                takeUntil(this.destroy$)
            )
            .subscribe({
                next: (response) => {
                    const { assistanceIncidents } = attendance;

                    if (!response.itemIncidentCode.isAdditional) {
                        attendance.incidentCode = incidentCode;
                        attendance.assistanceIncidents = assistanceIncidents
                            ? assistanceIncidents.map((item) => {
                                if (!item.isAdditional) {
                                    return {
                                        ...item,
                                        incidentCode: response.incidentCode,
                                        label: response.itemIncidentCode.label,
                                        isAdditional: response.itemIncidentCode.isAdditional,
                                    };
                                }
                                return item;
                            })
                            : [{
                                ...response,
                                label: response.itemIncidentCode.label,
                                isAdditional: response.itemIncidentCode.isAdditional,
                            }];
                    } else {
                        attendance.assistanceIncidents = [
                            ...(assistanceIncidents || []),
                            {
                                ...response,
                                label: response.itemIncidentCode.label,
                                isAdditional: response.itemIncidentCode.isAdditional,
                            }
                        ];
                    }

                    this.showSuccess('Incidencia registrada');
                },
                error: (err) => {
                    const message = err.error?.message || 'Ocurrió un error, por favor intentalo más tarde';
                    this.showError(message);
                }
            });
    }

    public asignDoubleShift(attendance: IAttendance, employee: IEmployeeAttendance): void {
        if (this.closedPeriod) {
            return;
        }

        const dialogRef = this.dialog.open<AssignDoubleShiftComponent, IAssignDoubleShift, { confirm: boolean }>(AssignDoubleShiftComponent, {
            data: {
                employeCode: employee.codigo.toString(),
                employeName: `${employee.name} ${employee.lastName} ${employee.mLastName}`,
                date: dayjs(attendance.date).toDate(),
            },
        });

        dialogRef.afterClosed()
            .pipe(takeUntil(this.destroy$))
            .subscribe(result => {
                if (result?.confirm) {
                    const identifyIncident = `${employee.codigo}${employee.company}${attendance.date}`;
                    this.listItemsLoading.update(items => {
                        const newSet = new Set(items);
                        newSet.add(identifyIncident);
                        return newSet;
                    });

                    this.service.assignDoubleShift(attendance.date, employee.codigo)
                        .pipe(
                            finalize(() => {
                                this.listItemsLoading.update(items => {
                                    const newSet = new Set(items);
                                    newSet.delete(identifyIncident);
                                    return newSet;
                                });
                            }),
                            takeUntil(this.destroy$)
                        )
                        .subscribe({
                            next: (response) => {
                                const dateFormat = dayjs(attendance.date).format("YYYY-MM-DD");
                                const findAttendance = employee.attendances?.findIndex((item) => item.date === dateFormat);
                                if (findAttendance !== undefined && findAttendance >= 0) {
                                    employee.attendances![findAttendance].assistanceIncidents = [
                                        ...(employee.attendances![findAttendance].assistanceIncidents || []),
                                        response,
                                    ];
                                }
                                this.showSuccess('Asignación completa');
                            },
                            error: (err) => {
                                const message = err.error?.message || 'Ocurrió un error, por favor intentalo más tarde';
                                this.showError(message);
                            }
                        });
                }
            });
    }

    public asignWorkedDayOff(): void {
        const dialogRef = this.dialog.open<AssignWorkedDayOffComponent, IAssignWorkedDayOff>(AssignWorkedDayOffComponent, {
            data: this.workedDayOff(),
        });

        dialogRef.afterClosed()
            .pipe(takeUntil(this.destroy$))
            .subscribe(() => {
                // Handler for dialog close
            });
    }

    public asignIncident(employee: IEmployeeAttendance): void {
        const dialogRef = this.dialog.open<AssignSpecialIncidentComponent, IAssignSpecialIncident>(AssignSpecialIncidentComponent, {
            data: {
                activity: employee.activity,
                codigo: employee.codigo,
                name: `${employee.name} ${employee.lastName} ${employee.mLastName}`,
                dates: this.listDates(),
                incidentCodes: this.listIncidentCodesAditional()
            }
        });

        dialogRef.afterClosed()
            .pipe(takeUntil(this.destroy$))
            .subscribe(result => {
                if (result) {
                    const dateFormat = dayjs(result.date).format("YYYY-MM-DD");
                    const findAttendance = employee.attendances?.findIndex((item) => item.date === dateFormat);

                    if (findAttendance !== undefined && findAttendance >= 0) {
                        employee.attendances![findAttendance].assistanceIncidents = [
                            ...(employee.attendances![findAttendance].assistanceIncidents || []),
                        ];

                        this.setIncidencia(result.incidentCode, employee.codigo, employee.company, employee.attendances![findAttendance], result.customValue);
                    } else {
                        this.showError('Fecha no válida');
                    }
                }
            });
    }

    public detailsDay(employee: IEmployeeAttendance, attendance: IAttendance): void {
        const dialogRef = this.dialog.open<DetailDayComponent, IDetailsDay, { deleted: Array<string> }>(DetailDayComponent, {
            data: {
                assistanceIncidents: attendance.assistanceIncidents,
                name: `${employee.name} ${employee.lastName} ${employee.mLastName}`,
                activity: employee.activity,
                codigo: employee.codigo,
                date: attendance.date,
                service: this.service,
                checkEntry: attendance.checkEntry,
                checkOut: attendance.checkOut,
                closedPeriod: this.closedPeriod,
            }
        });

        dialogRef.afterClosed()
            .pipe(takeUntil(this.destroy$))
            .subscribe(result => {
                if (result?.deleted.length) {
                    const hasNonAdditional = attendance.assistanceIncidents?.some(
                        (item) => !item.isAdditional && result.deleted.includes(item.id)
                    );

                    if (hasNonAdditional) {
                        attendance.incidentCode = 'N/A';
                    }

                    attendance.assistanceIncidents = attendance.assistanceIncidents?.filter(
                        (item) => !result.deleted.includes(item.id)
                    );
                }
            });
    }

    public getIsLoading(codigo: number, company: number, date: string): boolean {
        return this.listItemsLoading().has(`${codigo}${company}${date}`);
    }

    public downloadReport(typeFileDownload: TypeFileDownload): void {
        if (!this.payroll) {
            this.showError('Selecciona un tipo de nómina');
            return;
        }

        if (!this.period) {
            this.showError('Selecciona un periodo');
            return;
        }

        this.loading.set(true);
        this.service.downloadReport(this.payroll.typeNom, this.period.numPeriod, typeFileDownload)
            .pipe(
                finalize(() => this.loading.set(false)),
                takeUntil(this.destroy$)
            )
            .subscribe({
                next: (response) => {
                    const blob = new Blob([response]);
                    const urlBlob = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = urlBlob;
                    const type = typeFileDownload === TypeFileDownload.XLSX ? 'xlsx' : 'pdf';
                    link.download = `tarjeta_asistencia.${type}`;
                    link.click();

                    // Revocar URL después de un pequeño delay para asegurar descarga
                    timer(100)
                        .pipe(takeUntil(this.destroy$))
                        .subscribe(() => {
                            window.URL.revokeObjectURL(urlBlob);
                        });
                },
                error: (err) => {
                    const message = err.error?.message || 'Ocurrió un error, por favor intentalo más tarde';
                    this.showError(message);
                }
            });
    }

    public isInconsistencyChecks(attendance: IAttendance): boolean {
        if (!attendance.checkEntry) {
            return false;
        }

        const fechaInicio = dayjs(`${attendance.date}T${attendance.checkEntry}`);
        const fechaFin = dayjs(`${attendance.date}T${attendance.checkOut || attendance.checkEntry}`);
        const diferenciaEnMinutos = fechaFin.diff(fechaInicio, 'hour');

        return diferenciaEnMinutos <= 5;
    }

    public confirmClosePeriod(): void {
        if (!this.payroll) {
            this.showError('Selecciona un tipo de nómina');
            return;
        }

        if (!this.period) {
            this.showError('Selecciona un periodo');
            return;
        }

        const dialogRef = this.dialog.open<ConfirmClosePeriodComponent, IConfirmClosePeriod, { confirm: boolean, tenant: string }>(ConfirmClosePeriodComponent, {
            data: {
                periodName: this.period ? `${this.period.numPeriod} - ${dayjs(this.period.startDate).format("DD/MM/YYYY")} - ${dayjs(this.period.closingDate).format("DD/MM/YYYY")}` : '',
                tenantId: this.authService.activeTenant.value.trim().replace(/\s+/g, ''),
                closedPeriod: this.closedPeriod,
                listPeriodStatus: this.listPeriodStatus(),
                TypePayroll: this.payroll!.typeNom,
                NumPeriod: this.period!.numPeriod,
            },
        });

        dialogRef.afterClosed()
            .pipe(takeUntil(this.destroy$))
            .subscribe(result => {
                if (result?.confirm) {
                    this.loading.set(true);
                    this.service.changePeridStatus({
                        TypePayroll: this.payroll!.typeNom,
                        TenantId: result.tenant.trim(),
                        NumPeriod: this.period!.numPeriod,
                    })
                    .pipe(
                        finalize(() => this.loading.set(false)),
                        takeUntil(this.destroy$)
                    )
                    .subscribe({
                        next: (response) => {
                            this.listPeriodStatus.set(response);
                            this.showSuccess('El periodo ha sido modificado');
                        },
                        error: (err) => {
                            const message = err.error?.message || 'Ocurrió un error, por favor intentalo más tarde';
                            this.showError(message);
                        }
                    });
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

    public handleChangeAttendance(employee: IEmployeeAttendance, attendance: IAttendance): void {
        const dialogRef = this.dialog.open<ChangeAttendanceComponent, IChangeAttendance, IChangeAttendanceResponse>(ChangeAttendanceComponent, {
            data: {
                date: attendance.date,
                day: attendance.day,
                label: attendance.label,
                employeeId: employee.codigo,
                employeeName: `${employee.name} ${employee.lastName} ${employee.mLastName}`,
                employeeCode: employee.codigo.toString(),
                employeeActivity: employee.activity,
                checkEntryId: attendance.checkEntryId,
                checkEntry: attendance.checkEntry,
                checkOutId: attendance.checkOutId,
                checkOut: attendance.checkOut,
                service: this.service,
            }
        });

        dialogRef.afterClosed()
            .pipe(takeUntil(this.destroy$))
            .subscribe(result => {
                if (result?.confirm) {
                    this.showSuccess('Asistencia actualizada');
                    // Refrescar datos
                    this.searchTrigger$.next(this.searchControl.value || '');
                } else if (result?.errorMessage) {
                    this.showError(result.errorMessage);
                }
            });
    }

    /**
     * Muestra mensaje de error en snackbar
     */
    private showError(message: string): void {
        this._snackBar.open(message, '❌', {
            horizontalPosition: 'center',
            verticalPosition: 'top',
            panelClass: 'alert-error',
            duration: 3000
        });
    }

    /**
     * Muestra mensaje de éxito en snackbar
     */
    private showSuccess(message: string): void {
        this._snackBar.open(message, '✅', {
            horizontalPosition: 'center',
            verticalPosition: 'top',
            panelClass: 'alert-success',
            duration: 3000
        });
    }

    private generarFechas(startDate: string | Date, endDate: string | Date): Array<GeneratedDates> {
        const dates: Array<GeneratedDates> = [];
        let startAdmin = dayjs(startDate);
        const endAdmin = dayjs(endDate);

        while (startAdmin.isBefore(endAdmin) || startAdmin.isSame(endAdmin)) {
            dates.push({
                day: startAdmin.format("ddd").toUpperCase(),
                date: startAdmin.format("YYYY-MM-DD"),
                label: startAdmin.format("DD/MM/YY"),
            });
            startAdmin = startAdmin.add(1, "day");
        }

        return dates;
    }
}
