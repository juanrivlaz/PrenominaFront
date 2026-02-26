import { ChangeDetectionStrategy, Component, inject, model, OnInit, signal, ViewEncapsulation, WritableSignal } from "@angular/core";
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
import { combineLatest, debounceTime, finalize, forkJoin } from "rxjs";
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
export class AttendaceComponent implements OnInit {
    private readonly _snackBar = inject(MatSnackBar);
    private readonly dialog = inject(MatDialog);
    private _listPeriods: WritableSignal<Array<IPrenominaPeriod>> = signal([]);
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
    public listItemsLoading: WritableSignal<Array<string>> = signal([]);
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
        combineLatest([this.authService.activeCompany, this.authService.activeTenant]).subscribe(() => {
            this.getInit();
        });

        this.searchControl.valueChanges.pipe(debounceTime(1200)).subscribe((value) => {
            this.get(value);
        });

        const storageTypeNom = window.sessionStorage.getItem(SysKey.ActiveTypeNom);
        if (storageTypeNom) {
            this.setPayroll(parseInt(storageTypeNom, 10));
        }

        const storageNumPeriod = window.sessionStorage.getItem(SysKey.ActiveNumPeriod);
        if (storageNumPeriod) {
            setTimeout(() => {
                this.setPeriod(parseInt(storageNumPeriod, 10));
            }, 800);
        }

        this.authService.sectionsForAccess.subscribe((sections) => {
            const role = this.authService.role;
            const sectionTAsistencia = sections.find((item) => item.sectionsCode.includes('tasistencia'));

            this.canClosePayrollPeriod = role === 'sudo' || (sectionTAsistencia !== undefined && sectionTAsistencia.permissions["CanClosePayrollPeriod"] === true);
            this.canModifyCheckins = role === 'sudo' || (sectionTAsistencia !== undefined && sectionTAsistencia.permissions["CanModifyCheckins"] === true);
        });
    }

    public getInit(): void {
        this.loading.set(true);
        forkJoin([this.service.getDayOffs(), this.service.getInit()]).pipe(finalize(() => {
            this.loading.set(false);
        })).subscribe({
            next: (response) => {
                this.listPayrolls.set(response[1].payrolls);
                this._listPeriods.set(response[1].periods);
                this.listPeriodStatus.set(response[1].periodStatus);
                this.listIncidentCodes.set(response[1].incidentCodes.filter((item) => !item.isAdditional));
                this.listIncidentCodesAditional.set(response[1].incidentCodes.filter((item) => item.isAdditional));
                this.listDayOffs = response[0];
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

    public get closedPeriod(): boolean {
        if (!this.payroll || !this.period) {
            return false;
        }

        return this.listPeriodStatus().some(
            (item) => item.typePayroll === this.payroll?.typeNom && 
                item.numPeriod === this.period?.numPeriod && 
                (item.tenantId === '-999' || item.tenantId === this.authService.activeTenant.value.trim().replace('/\s+/g', '')) &&
                item.companyId === this.authService.activeCompany.value
        );
    }

    public get(search: string = ''): void {
        if (!this.payroll) {
            this._snackBar.open('Selecciona un tipo de nómina', undefined, {
                horizontalPosition: 'center',
                verticalPosition: 'top',
                panelClass: 'alert-error',
                duration: 3000
            });

            return;
        }

        if (!this.period) {
            this._snackBar.open('Selecciona un periodo', undefined, {
                horizontalPosition: 'center',
                verticalPosition: 'top',
                panelClass: 'alert-error',
                duration: 3000
            });

            return;
        }
        const listDates = this.generarFechas(this.period.startDate, this.period.closingDate);
        this.listDates.set(listDates);
        this.configService.setLoading(true);
        this.service.get(this.paginatorDetails().page, 30, this.payroll.typeNom, this.period.numPeriod, search || this.searchControl.value || '').pipe(finalize(() => {
            this.configService.setLoading(false);
        })).subscribe({
            next: (response) => {
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
            },
            error: (err) => {
                const message = err.error?.message || 'Ocurrió un error, por favor intentalo más tarde';

                this._snackBar.open(message, undefined, {
                  horizontalPosition: 'center',
                  verticalPosition: 'top',
                  panelClass: 'alert-error',
                  duration: 3000
                });
            }
        })
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
        return this.listDates().map((date) => {
            const attendance = employee.attendances?.find((item) => item.date === date.date);
            const findInDayOff = this.listDayOffs.findIndex((item) => {
                const dateoff = dayjs(item.date);
                const dt = dayjs(date.date);

                return dt.month() === dateoff.month() && dt.date() === dateoff.date();
            });

            return {
                ...(attendance ? {
                    ...attendance,
                    label: date.label,
                    day: date.day,
                    isInconsistency: this.isInconsistencyChecks(attendance),
                    isDayOff: findInDayOff >= 0
                } : {
                    date: date.date,
                    label: date.label,
                    day: date.day,
                    checkEntry: null,
                    checkOut: null,
                    incidentCode: 'N/A',
                    isDayOff: findInDayOff >= 0
                }),
            }
        });
    }

    public setIncidencia(incidentCode: string, employeeCode: number, company: number, attendance: IAttendance, customValue?: number): void {
        const identifyIncident = `${employeeCode}${company}${attendance.date}`;
        this.listItemsLoading.update(items => [...items, identifyIncident]);
        this.service.insertAttendaceIncident(incidentCode, attendance.date, employeeCode, customValue).pipe(finalize(() => {
            this.listItemsLoading.update(items => items.filter((item) => item !== identifyIncident));
        })).subscribe({
            next: (response) => {
                const { assistanceIncidents } = attendance;

                if (!response.itemIncidentCode.isAdditional) {
                    attendance.incidentCode = incidentCode;
                }
                
                if (!response.itemIncidentCode.isAdditional) {
                    attendance.assistanceIncidents = assistanceIncidents ? assistanceIncidents.map((item) => {
                        if (!item.isAdditional) {
                            return {
                                ...item,
                                incidentCode: response.incidentCode,
                                label: response.itemIncidentCode.label,
                                isAdditional: response.itemIncidentCode.isAdditional,
                            };
                        }

                        return item;
                    }) : [{
                        ...response,
                        label: response.itemIncidentCode.label,
                        isAdditional: response.itemIncidentCode.isAdditional,
                    }];
                } else {
                    attendance.assistanceIncidents = assistanceIncidents ? [...assistanceIncidents, {
                        ...response,
                        label: response.itemIncidentCode.label,
                        isAdditional: response.itemIncidentCode.isAdditional,
                    }] : [{
                        ...response,
                        label: response.itemIncidentCode.label,
                        isAdditional: response.itemIncidentCode.isAdditional,
                    }];
                }

                this._snackBar.open('Incidencia registrada', '✅', {
                  horizontalPosition: 'center',
                  verticalPosition: 'top',
                  panelClass: 'alert-success',
                  duration: 3000
                });
            },
            error: (err) => {
                const message = err.error?.message || 'Ocurrió un error, por favor intentalo más tarde';

                this._snackBar.open(message, undefined, {
                  horizontalPosition: 'center',
                  verticalPosition: 'top',
                  panelClass: 'alert-error',
                  duration: 3000
                });
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

        dialogRef.afterClosed().subscribe(result => {
            if (result?.confirm) {
                const identifyIncident = `${employee.codigo}${employee.company}${attendance.date}`;
                this.listItemsLoading.update(items => [...items, identifyIncident]);

                this.service.assignDoubleShift(attendance.date, employee.codigo).pipe(finalize(() => {
                    this.listItemsLoading.update(items => items.filter((item) => item !== identifyIncident));
                })).subscribe({
                    next: (response) => {
                        const dateFormat = dayjs(attendance.date);
                        var findAttendance = employee.attendances?.findIndex((item) => item.date === dateFormat.format("YYYY-MM-DD"));
                        if (findAttendance && findAttendance >= 0) {
                            employee.attendances![findAttendance].assistanceIncidents = [
                                ...employee.attendances![findAttendance].assistanceIncidents || [],
                                response,
                            ];
                        }

                        this._snackBar.open('Asignación complete', '✅', {
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
                            panelClass: 'alert-error',
                            duration: 3000
                        });
                    }
                });
            }
        })
    }

    public asignWorkedDayOff(): void {
        const dialogRef = this.dialog.open<AssignWorkedDayOffComponent, IAssignWorkedDayOff>(AssignWorkedDayOffComponent, {
            data: this.workedDayOff(),
        });

        dialogRef.afterClosed().subscribe(result => {
            console.log('the assign worked day off', result);

            if (result !== undefined) {
                console.log({
                    update: this.workedDayOff(),
                });
            }
        })
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

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                const dateFormat = dayjs(result.date);

                var findAttendance = employee.attendances?.findIndex((item) => item.date === dateFormat.format("YYYY-MM-DD"));

                if (findAttendance !== undefined && findAttendance >= 0) {
                    employee.attendances![findAttendance].assistanceIncidents = [
                        ...employee.attendances![findAttendance].assistanceIncidents || [],
                    ];

                    this.setIncidencia(result.incidentCode, employee.codigo, employee.company, employee.attendances![findAttendance], result.customValue);
                } else {
                    this._snackBar.open('Fecha no valida', undefined, {
                        horizontalPosition: 'center',
                        verticalPosition: 'top',
                        panelClass: 'alert-error',
                        duration: 3000
                    });
                }
            }
        })
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

        dialogRef.afterClosed().subscribe(result => {
            if (result?.deleted.length) {
                const isNotAdditional = attendance.assistanceIncidents?.filter((item) => item.isAdditional && result.deleted.includes(item.id));

                if (isNotAdditional) {
                    attendance.incidentCode = 'N/A';
                }

                attendance.assistanceIncidents = attendance.assistanceIncidents?.filter((item) => !result.deleted.includes(item.id));
            }
        });
    }

    public getIsLoading(codigo: number, company: number, date: string): boolean {
        return this.listItemsLoading().findIndex((item) => item === `${codigo}${company}${date}`) >= 0;
    }

    public downloadReport(typeFileDownload: TypeFileDownload): void {
        if (!this.payroll) {
            this._snackBar.open('Selecciona un tipo de nómina', undefined, {
                horizontalPosition: 'center',
                verticalPosition: 'top',
                panelClass: 'alert-error',
                duration: 3000
            });

            return;
        }

        if (!this.period) {
            this._snackBar.open('Selecciona un periodo', undefined, {
                horizontalPosition: 'center',
                verticalPosition: 'top',
                panelClass: 'alert-error',
                duration: 3000
            });

            return;
        }

        this.loading.set(true);
        this.service.downloadReport(this.payroll.typeNom, this.period.numPeriod, typeFileDownload).pipe(finalize(() => {
            this.loading.set(false);
        })).subscribe({
            next: (response) => {
                const urlBlob = window.URL.createObjectURL(new Blob([response]));
                const link = document.createElement('a');
                link.href = urlBlob;
                var type = typeFileDownload === TypeFileDownload.XLSX ? 'xlsx' : 'pdf';
                link.download = `tarjeta_asistencia.${type}`;
                link.click();

                window.URL.revokeObjectURL(urlBlob);
            },
            error: (err) => {
                const message = err.error?.message || 'Ocurrió un error, por favor intentalo más tarde';

                this._snackBar.open(message, undefined, {
                  horizontalPosition: 'center',
                  verticalPosition: 'top',
                  panelClass: 'alert-error',
                  duration: 3000
                });
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
            this._snackBar.open('Selecciona un tipo de nómina', undefined, {
                horizontalPosition: 'center',
                verticalPosition: 'top',
                panelClass: 'alert-error',
                duration: 3000
            });

            return;
        }

        if (!this.period) {
            this._snackBar.open('Selecciona un periodo', undefined, {
                horizontalPosition: 'center',
                verticalPosition: 'top',
                panelClass: 'alert-error',
                duration: 3000
            });

            return;
        }

        const dialogRef = this.dialog.open<ConfirmClosePeriodComponent, IConfirmClosePeriod, { confirm: boolean, tenant: string }>(ConfirmClosePeriodComponent, {
            data: {
                periodName: this.period ? `${this.period.numPeriod} - ${dayjs(this.period.startDate).format("DD/MM/YYYY")} - ${dayjs(this.period.closingDate).format("DD/MM/YYYY")}` : '',
                tenantId: this.authService.activeTenant.value.trim().replace('/\s+/g', ''),
                closedPeriod: this.closedPeriod,
                listPeriodStatus: this.listPeriodStatus(),
                TypePayroll: this.payroll!.typeNom,
                NumPeriod: this.period!.numPeriod,
            },
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result?.confirm) {
                this.loading.set(true);
                this.service.changePeridStatus({
                    TypePayroll: this.payroll!.typeNom,
                    TenantId: result.tenant.trim(),
                    NumPeriod: this.period!.numPeriod,
                }).pipe(finalize(() => {
                    this.loading.set(false);
                })).subscribe({
                    next: (response) => {
                        this.listPeriodStatus.set(response);
                        setTimeout(() => {
                            this._snackBar.open(`El periodo ha sido modificado`, '✅', {
                                horizontalPosition: 'center',
                                verticalPosition: 'top',
                                panelClass: 'alert-success',
                                duration: 3000
                            });
                        }, 500);
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
        });
    }

    public handlePageEvent(e: PageEvent): void {
        this.paginatorDetails.update((state) => ({
            ...state,
            page: e.pageIndex + 1
        }));

        setTimeout(() => {
            this.get();
        }, 200);
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

        dialogRef.afterClosed().subscribe(result => {
            if (result?.confirm) {
                this._snackBar.open('Asistencia actualizada', '✅', {
                    horizontalPosition: 'center',
                    verticalPosition: 'top',
                    panelClass: 'alert-success',
                    duration: 3000
                });

                setTimeout(() => {
                    this.get();
                }, 200);
            } else if (result?.errorMessage) {
                this._snackBar.open(result.errorMessage, '❌', {
                    horizontalPosition: 'center',
                    verticalPosition: 'top',
                    panelClass: 'alert-error',
                    duration: 3000
                });
            }
        });
    }

    private generarFechas(startDate: string | Date, endDate: string | Date): Array<GeneratedDates> {
        let dates: Array<GeneratedDates> = [];
        let startAdmin = dayjs(startDate);
        let endAdmin = dayjs(endDate);

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
