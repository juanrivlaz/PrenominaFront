import { ChangeDetectionStrategy, Component, computed, inject, model, OnInit, OnDestroy, signal, ViewEncapsulation, WritableSignal } from "@angular/core";
import { MaterialModule } from "../../shared/modules/material/material.module";
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { CommonModule } from "@angular/common";
import { MatDialog } from "@angular/material/dialog";
import { AssignDoubleShiftComponent } from "./assign-double-shift/assign-double-shift.component";
import { IAssignDoubleShift } from "./assign-double-shift/assign-double-shift.interface";
import { AssignWorkedDayOffComponent } from "./assign-worked-day-off/assign-worked-day-off.component";
import { IAssignWorkedDayOff } from "./assign-worked-day-off/assign-worked-day-off.interface";
import { AssignSpecialIncidentComponent } from "./assign-special-incident/assign-special-incident.component";
import { DetailDayComponent } from "./details-day/details-day.component";
import { AttendaceService } from "./attendace.service";
import { BehaviorSubject, combineLatest, debounceTime, finalize, forkJoin, Subject, switchMap, takeUntil, timer, of } from "rxjs";
import { MatSnackBar } from "@angular/material/snack-bar";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { AuthService } from "@core/services/auth/auth.service";
import { buildReportFileName } from "@core/utils/file-name";
import { RoleCode } from "@core/models/enum/role-code";
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
        MatSlideToggleModule,
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

    // Subjects reactivos para payroll y period
    private readonly activePayroll$ = new BehaviorSubject<number>(0);
    private readonly activePeriod$ = new BehaviorSubject<number>(0);

    // Indica que getInit() ya trajo los catálogos (payrolls, periodos, etc.).
    // Evita disparar la carga (y el falso error "Selecciona un tipo de nómina")
    // mientras las listas todavía están vacías.
    private readonly dataLoaded$ = new BehaviorSubject<boolean>(false);

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
    public filterMissingOnly: WritableSignal<boolean> = signal(false);

    public readonly filteredEmployeeAttendance = computed(() => {
        const employees = this.listEmployeeAttendance();
        if (!this.filterMissingOnly()) return employees;

        return employees
            .map(emp => {
                const missingDays = emp.attendances?.filter(
                    (a: IAttendance) => a.checkEntry === null && a.incidentCode === 'N/A' && !a.isDayOff
                ) || [];

                if (missingDays.length === 0) return null;

                return {
                    ...emp,
                    attendances: missingDays
                };
            })
            .filter(Boolean) as Array<IEmployeeAttendance>;
    });

    constructor(
        private readonly service: AttendaceService,
        private readonly authService: AuthService,
        private readonly configService: AppConfigService,
    ) {}

    ngOnInit(): void {
        // Only call getInit when activeCompany changes and the company is valid.
        // Avoids firing the request with company "0" (no selection), which the backend
        // rejects with "El identificador de empresa no es válido".
        this.authService.activeCompany
            .pipe(takeUntil(this.destroy$))
            .subscribe((company) => {
                if (this.isValidCompany(company)) {
                    this.getInit();
                } else {
                    // No valid company yet: stop the loading indicator so the page doesn't
                    // stay stuck on the progress bar while waiting for a company selection.
                    this.loading.set(false);
                }
            });

        // Cargar datos cuando cambia cualquiera de los 4 valores (empresa, departamento,
        // tipo de nómina, periodo) Y los catálogos ya están cargados (dataLoaded$).
        // Se valida contra los objetos resueltos (this.payroll / this.period) y no contra
        // los números crudos, para no disparar la carga antes de que getInit() traiga las
        // listas (lo que provocaba el falso error "Selecciona un tipo de nómina").
        combineLatest([
            this.authService.activeCompany,
            this.authService.activeTenant,
            this.activePayroll$,
            this.activePeriod$,
            this.dataLoaded$
        ]).pipe(
            takeUntil(this.destroy$)
        ).subscribe(([company, tenant, , , loaded]) => {
            if (loaded && company && tenant && this.payroll && this.period) {
                this.listDates.set(this.generarFechas(this.period.startDate, this.period.closingDate));
                this.searchTrigger$.next(this.searchControl.value || '');
            } else {
                this.listEmployeeAttendance.set([]);
                this.listDates.set([]);
                this.paginatorDetails.set({ totalRecord: 0, pageSize: 30, page: 1 });
            }
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

        // Restaurar selección previa. getInit() revalida estos valores contra los
        // catálogos cargados y selecciona el primer elemento si ya no existen, así que
        // basta con fijarlos aquí (la carga real espera a dataLoaded$).
        const storageTypeNom = window.localStorage.getItem(SysKey.ActiveTypeNom);
        if (storageTypeNom) {
            const parsedTypeNom = parseInt(storageTypeNom, 10);
            if (!isNaN(parsedTypeNom)) {
                this.activePayroll = parsedTypeNom;
            }
        }

        const storageNumPeriod = window.localStorage.getItem(SysKey.ActiveNumPeriod);
        if (storageNumPeriod) {
            const parsedNumPeriod = parseInt(storageNumPeriod, 10);
            if (!isNaN(parsedNumPeriod)) {
                this.activePeriod = parsedNumPeriod;
            }
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
        this.activePayroll$.complete();
        this.activePeriod$.complete();
        this.dataLoaded$.complete();
        // Limpiar cache
        this.dayOffsCache.clear();
    }

    // A company is valid when it is the superuser sentinel (-999) or a positive id.
    private isValidCompany(company: number): boolean {
        return company === -999 || company > 0;
    }

    public getInit(): void {
        this.loading.set(true);
        // Mientras se recargan los catálogos, marcar como no cargado para no disparar
        // una búsqueda con listas obsoletas/vacías.
        this.dataLoaded$.next(false);
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

                    // Revalidar activePayroll: si existe en la nueva lista dejarlo, si no
                    // seleccionar el primer tipo de nómina disponible.
                    const payrolls = response[1].payrolls;
                    const payrollExists = payrolls.some((p) => p.typeNom === this.activePayroll);
                    if (!payrollExists) {
                        this.setPayroll(payrolls[0]?.typeNom || 0);
                    }

                    // Revalidar activePeriod: dejarlo si existe en los periodos del tipo de
                    // nómina seleccionado; si no, seleccionar el primer periodo de corte.
                    const periods = this._listPeriods().filter((p) => p.typePayroll === this.activePayroll);
                    const periodExists = periods.some((p) => p.numPeriod === this.activePeriod);
                    if (!periodExists) {
                        this.setPeriod(periods[0]?.numPeriod || 0);
                    }

                    // Catálogos listos: habilita la carga reactiva de datos.
                    this.dataLoaded$.next(true);
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

    public get isAdmin(): boolean {
        return this.authService.role === RoleCode.Sudo;
    }

    public syncIncapacity(): void {
        if (!this.payroll) {
            this.showError('Selecciona un tipo de nómina');
            return;
        }
        if (!this.period) {
            this.showError('Selecciona un periodo');
            return;
        }

        this.configService.setLoading(true);
        this.service.syncIncapacity({
            TypeNom: this.payroll.typeNom,
            PeriodId: this.period.id,
            TenantId: this.authService.activeTenant.value
        }).pipe(
            finalize(() => this.configService.setLoading(false)),
            takeUntil(this.destroy$)
        ).subscribe({
            next: (result) => {
                this.showSuccess(`Sincronizadas ${result.totalIncapacities} incapacidades y ${result.totalVacations} vacaciones`);
                this.searchTrigger$.next(this.searchControl.value || '');
            },
            error: (err) => {
                this.showError(err.error?.message || 'Error al sincronizar');
            }
        });
    }

    public get closedPeriod(): boolean {
        if (!this.payroll || !this.period) {
            return false;
        }

        const activeTenant = this.authService.activeTenant.value.trim().replace(/\s+/g, '');
        const activeCompany = this.authService.activeCompany.value;

        const rows = this.listPeriodStatus().filter(
            (item) => item.typePayroll === this.payroll?.typeNom &&
                item.numPeriod === this.period?.numPeriod &&
                item.companyId === activeCompany &&
                (item.tenantId === '-999' || item.tenantId === activeTenant)
        );

        // Una excepción de apertura para este tenant gana sobre el cierre global.
        if (rows.some((item) => item.tenantId === activeTenant && item.isOpen)) {
            return false;
        }

        // Cerrado si hay un cierre para el tenant o un cierre global ('-999').
        return rows.some((item) => !item.isOpen);
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
        this.activePayroll$.next(id);
        window.localStorage.setItem(SysKey.ActiveTypeNom, id.toString());

        // Al cambiar el tipo de nómina, asegurar que el periodo seleccionado pertenezca a
        // esa nómina; si no, seleccionar el primer periodo de corte disponible.
        const periods = this.listPeriods;
        if (periods.length && !periods.some((p) => p.numPeriod === this.activePeriod)) {
            this.setPeriod(periods[0].numPeriod);
        }
    }

    public get period(): IPrenominaPeriod | undefined {
        return this.listPeriods.find((item) => item.numPeriod === this.activePeriod);
    }

    public setPeriod(id: number): void {
        this.activePeriod = id;
        this.activePeriod$.next(id);
        window.localStorage.setItem(SysKey.ActiveNumPeriod, id.toString());
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

    // El turno nocturno se define en el horario asignado al empleado y el backend lo
    // refleja igual en todos los días; basta con detectar cualquier día marcado.
    public isNightShiftEmployee(employee: IEmployeeAttendance): boolean {
        return employee.attendances?.some((attendance) => attendance.isNightShift) ?? false;
    }

    // Las incidencias generadas por un flujo de aprobación (solicitudes de ausencia o
    // incidencias que requieren aprobación) no se pueden editar ni eliminar desde asistencia;
    // se gestionan desde la bandeja de aprobaciones.
    public hasApprovalFlowIncident(attendance: IAttendance): boolean {
        return attendance.assistanceIncidents?.some(
            (incident) => incident.fromApprovalFlow && !incident.isAdditional
        ) ?? false;
    }

    public setIncidencia(incidentCode: string, employeeCode: number, company: number, attendance: IAttendance, customValue?: number, notes?: string): void {
        const identifyIncident = `${employeeCode}${company}${attendance.date}`;

        // Usar Set para mejor rendimiento
        this.listItemsLoading.update(items => {
            const newSet = new Set(items);
            newSet.add(identifyIncident);
            return newSet;
        });

        this.service.insertAttendaceIncident(incidentCode, attendance.date, employeeCode, customValue, notes)
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

                    // El backend debe devolver itemIncidentCode con los metadatos del código;
                    // si por alguna razón llega vacío usamos el código enviado para no romper la UI.
                    const itemIncidentCode = response?.itemIncidentCode;

                    // Las incidencias que requieren aprobación quedan pendientes y NO deben mostrarse
                    // en asistencia (ni en la celda ni en el detalle del día) hasta ser aprobadas.
                    if (response?.approved) {
                        if (!itemIncidentCode?.isAdditional) {
                            attendance.incidentCode = incidentCode;
                            attendance.assistanceIncidents = assistanceIncidents
                                ? assistanceIncidents.map((item) => {
                                    if (!item.isAdditional) {
                                        return {
                                            ...item,
                                            incidentCode: response.incidentCode,
                                            label: itemIncidentCode?.label,
                                            isAdditional: itemIncidentCode?.isAdditional ?? false,
                                        };
                                    }
                                    return item;
                                })
                                : [{
                                    ...response,
                                    label: itemIncidentCode?.label,
                                    isAdditional: itemIncidentCode?.isAdditional ?? false,
                                }];
                        } else {
                            attendance.assistanceIncidents = [
                                ...(assistanceIncidents || []),
                                {
                                    ...response,
                                    label: itemIncidentCode?.label,
                                    isAdditional: itemIncidentCode?.isAdditional ?? true,
                                }
                            ];
                        }
                    }

                    this.showSuccess(
                        response?.approved
                            ? 'Incidencia registrada'
                            : 'Incidencia registrada, pendiente de aprobación'
                    );
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

                        this.setIncidencia(result.incidentCode, employee.codigo, employee.company, employee.attendances![findAttendance], result.customValue, result.notes);
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
                    link.download = buildReportFileName('tarjeta_asistencia', {
                        tenant: this.authService.getActiveTenantName(),
                        period: this.period?.numPeriod,
                        year: this.authService.year.value
                    }, type);
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

        // Para turnos nocturnos, la salida puede caer el día siguiente — no es una inconsistencia.
        if (attendance.isNightShift) {
            return false;
        }

        const fechaInicio = dayjs(`${attendance.date}T${attendance.checkEntry}`);
        const checkOutDate = attendance.checkOutDate || attendance.date;
        const fechaFin = dayjs(`${checkOutDate}T${attendance.checkOut || attendance.checkEntry}`);
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
        if (this.closedPeriod) {
            this.showError('El periodo está cerrado. No se pueden modificar las checadas.');
            return;
        }

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
                isNightShift: attendance.isNightShift,
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

    public fixNightShiftChecks(): void {
        this.loading.set(true);
        this.service.fixNightShiftEoS()
            .pipe(
                finalize(() => this.loading.set(false)),
                takeUntil(this.destroy$)
            )
            .subscribe({
                next: (response) => {
                    this.showSuccess(response.message);
                    this.searchTrigger$.next(this.searchControl.value || '');
                },
                error: (err) => {
                    const message = err.error?.message || 'Ocurrio un error al corregir checadas nocturnas';
                    this.showError(message);
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
