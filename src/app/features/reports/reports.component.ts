import { CommonModule } from "@angular/common";
import { Component, inject, model, OnInit, signal, viewChild, ViewEncapsulation, WritableSignal } from "@angular/core";
import { MatChipsModule } from "@angular/material/chips";
import { MatDividerModule } from "@angular/material/divider";
import { appAnimations } from "@core/animations";
import { AppConfigService } from "@core/services/app-config/app-config.service";
import { MaterialModule } from "@shared/modules/material/material.module";
import { ReportsService } from "./reports.service";
import { DelaysTableComponent } from "./delays-table/delays-table.component";
import { MatTableDataSource } from "@angular/material/table";
import { IDelayReport } from "@core/models/reports/delays.interface";
import { HoursWorkedTableComponent } from "./hours-worked-table/hours-worked-table.component";
import { OvertimesTableComponent } from "./overtimes-table/overtimes-table.component";
import { IOvertimeReport } from "@core/models/reports/overtimes.interface";
import { IHoursWorkedReport } from "@core/models/reports/hours-worked.interface";
import { Section } from "./enums/section.enum";
import { MatMenuModule } from "@angular/material/menu";
import { FormControl, FormGroup, ReactiveFormsModule } from "@angular/forms";
import { IPayroll } from "@core/models/payroll.interface";
import { SysKey } from "@core/models/enum/sys-key";
import { IPrenominaPeriod } from "@core/models/prenomina-period.interface";
import { TypeFileDownload } from "@core/models/enum/type-file-download";
import { MatSnackBar } from "@angular/material/snack-bar";
import { MatDialog } from "@angular/material/dialog";
import { AuthService } from "@core/services/auth/auth.service";
import { buildReportFileName } from "@core/utils/file-name";
import { combineLatest, debounceTime, finalize, Observable, take } from "rxjs";
import { HttpResponse } from "@angular/common/http";
import { IFilterReports } from "@core/models/reports/filter.interface";
import { IAttendanceReport } from "@core/models/reports/attendance.interface";
import { AttendanceTableComponent } from "./attendance-table/attendance-table.component";
import { MatDatepicker, MatDatepickerModule } from "@angular/material/datepicker";
import { IncidencesTableComponent } from "./incidences-table/incidences-table.component";
import { IIncidenceReport } from "@core/models/reports/incidences.interface";
import { ConfirmDialogComponent, ConfirmDialogData } from "@shared/components/confirm-dialog/confirm-dialog.component";
import dayjs from "dayjs";
import { AbandonmentTableComponent } from "./abandonment-table/abandonment-table.component";
import { IAbandonmentReport } from "@core/models/reports/abandonment.interface";

@Component({
    selector: 'app-reports',
    imports: [
        CommonModule,
        MaterialModule,
        MatChipsModule,
        MatDividerModule,
        MatMenuModule,
        MatDatepickerModule,
        ReactiveFormsModule,
        DelaysTableComponent,
        HoursWorkedTableComponent,
        OvertimesTableComponent,
        AttendanceTableComponent,
        IncidencesTableComponent,
        AbandonmentTableComponent,
    ],
    providers: [ReportsService],
    templateUrl: './reports.component.html',
    styleUrl: './reports.component.scss',
    animations: appAnimations,
    encapsulation: ViewEncapsulation.None,
})
export class ReportsComponent implements OnInit {
    // ViewChild usando signal-based API
    public readonly picker = viewChild<MatDatepicker<Date>>('dateFilter');

    private readonly _snackBar = inject(MatSnackBar);
    private readonly _dialog = inject(MatDialog);
    private _listPeriods: WritableSignal<Array<IPrenominaPeriod>> = signal([]);

    public delays: MatTableDataSource<IDelayReport> = new MatTableDataSource<IDelayReport>([]);
    public totalDelayRecords: number = 0;
    public delayPageSize: number = 1;

    public overtimes: MatTableDataSource<IOvertimeReport> = new MatTableDataSource<IOvertimeReport>([]);
    public totalOvertimeRecords: number = 0;
    public overtimePageSize: number = 1;

    public hoursWorked: MatTableDataSource<IHoursWorkedReport> = new MatTableDataSource<IHoursWorkedReport>([]);
    public totalHoursWorkedRecords: number = 0;
    public hoursWorkedPageSize: number = 1;

    public attendance: MatTableDataSource<IAttendanceReport> = new MatTableDataSource<IAttendanceReport>([]);
    public totalAttendanceRecords: number = 0;
    public attendancePageSize: number = 1;
    private allAttendance: Array<IAttendanceReport> = [];
    public onlyWithoutCheckOut = signal(false);

    public incidences: MatTableDataSource<IIncidenceReport> = new MatTableDataSource<IIncidenceReport>([]);
    public totalIncidencesRecords: number = 0;
    public incidencesPageSize: number = 1;

    public abandonment: MatTableDataSource<IAbandonmentReport> = new MatTableDataSource<IAbandonmentReport>([]);
    public totalAbandonmentRecords: number = 0;
    public abandonmentPageSize: number = 1;

    public activeSection = model<Section>(Section.Delays);
    public searchControl = new FormControl<string>('');
    public listPayrolls: WritableSignal<Array<IPayroll>> = signal([]);
    public loading: WritableSignal<boolean> = signal(true);
    public activePeriod: number = 0;
    public activePayroll: number = 0;

    public readonly filterForDates = new FormGroup({
        start: new FormControl<Date | null>(null),
        end: new FormControl<Date | null>(null),
    });

    // Señales para alimentar de forma reactiva la tabla de horas extras (que carga su propio
    // resumen): tenant activo y rango de fechas seleccionado.
    public readonly activeTenantId = signal<string>('');
    public readonly filterStart = signal<Date | null>(null);
    public readonly filterEnd = signal<Date | null>(null);
    
    public constructor(
        private readonly appConfigService: AppConfigService,
        private readonly authService: AuthService,
        private readonly reportsService: ReportsService,
    ) {}

    ngOnInit(): void {
        combineLatest([this.authService.activeCompany, this.authService.activeTenant]).subscribe(() => {
            this.activeTenantId.set(this.authService.activeTenant.value);
            this.getInit();
            // Refrescar la tabla activa al cambiar empresa/departamento sin requerir F5
            if (this.payroll && this.period) {
                this.get();
            }
        });

        this.searchControl.valueChanges.pipe(debounceTime(1200)).subscribe((value) => {
            this.get(value ?? '');
        });

        const storageTypeNom = window.localStorage.getItem(SysKey.ActiveTypeNom);
        if (storageTypeNom) {
            this.setPayroll(parseInt(storageTypeNom, 10));
        }

        const storageNumPeriod = window.localStorage.getItem(SysKey.ActiveNumPeriod);
        if (storageNumPeriod) {
            setTimeout(() => {
                this.setPeriod(parseInt(storageNumPeriod, 10));
            }, 800);
        }

        this.filterForDates.valueChanges.subscribe((value) => {
            // Mantener las señales sincronizadas para la tabla de horas extras (filtrado en cliente).
            this.filterStart.set(value.start ?? null);
            this.filterEnd.set(value.end ?? null);

            if (!value.start && !value.end) {
                this.get();
            } else if (value.start && value.end) {
                this.get('', {
                start: value.start,
                end: value.end,
            });
            }

        });
    }

    public openDatepicker(): void {
        this.picker()?.open();
    }

    public getInit(): void {
        this.appConfigService.setLoading(true);
        this.reportsService.getInit().subscribe({
            next: (response) => {
                this.listPayrolls.set(response.payrolls);
                this._listPeriods.set(response.periods);
            },
            error: (err) => {
                const message = err.error?.message || 'Ocurrió un error, por favor intentalo más tarde';

                this._snackBar.open(message, '❌', {
                    horizontalPosition: 'center',
                    verticalPosition: 'top',
                    panelClass: 'alert-error',
                    duration: 3000
                });
            },
            complete: () => {
                this.appConfigService.setLoading(false);
            }
        });
    }

    public get(search: string = '', filterDates?: { start: Date; end: Date }): void {
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

        if (this.activeSection() === Section.Delays) {
            this.getDelays(search, filterDates);
        } else if (this.activeSection() === Section.Overtimes) {
            this.getOvertimes(search, filterDates);
        } else if (this.activeSection() === Section.HoursWorked) {
            this.getHoursWorked(search, filterDates);
        } else if (this.activeSection() === Section.Attendance) {
            this.getAttendance(search, filterDates);
        } else if (this.activeSection() === Section.Incidences) {
            this.getIncidences(search, filterDates);
        } else if (this.activeSection() === Section.Abandonment) {
            this.getAbandonment(search, filterDates);
        }
    }

    public handleChangeSection(section: keyof typeof Section): void {
        this.activeSection.set(Section[section]);

        if (this.activeSection() === Section.Delays && this.delays.data.length) {
            return;
        } else if (this.activeSection() === Section.Overtimes && this.overtimes.data.length) {
            return;
        } else if (this.activeSection() === Section.HoursWorked && this.hoursWorked.data.length) {
            return;
        } else if (this.activeSection() === Section.Attendance && this.attendance.data.length) {
            return;
        } else if (this.activeSection() === Section.Incidences && this.incidences.data.length) {
            return;
        } else if (this.activeSection() === Section.Abandonment && this.abandonment.data.length) {
            return;
        }

        this.get();
    }

    public sectionIsActive(section: keyof typeof Section): boolean {
        return this.activeSection() === Section[section];
    }

    public get payroll(): IPayroll | undefined {
        return this.listPayrolls().find((item) => item.typeNom === this.activePayroll);
    }

    public setPayroll(id: number): void {
        this.activePayroll = id;
        window.localStorage.setItem(SysKey.ActiveTypeNom, id.toString());
    }

    public get listPeriods(): Array<IPrenominaPeriod> {
        return this._listPeriods().filter((item) => item.typePayroll === this.activePayroll);
    }

    public get period(): IPrenominaPeriod | undefined {
        return this.listPeriods.find((item) => item.numPeriod === this.activePeriod);
    }

    public setPeriod(id: number): void {
        if (this.activePeriod && this.activePayroll && this.activeSection() === Section.Overtimes) {
            this.reportsService.checkPendingOvertimes(this.activePayroll, this.activePeriod)
                .pipe(take(1))
                .subscribe({
                    next: (result) => {
                        if (result.hasPending) {
                            const dialogRef = this._dialog.open<ConfirmDialogComponent, ConfirmDialogData>(ConfirmDialogComponent, {
                                width: '450px',
                                data: {
                                    title: 'Horas extras sin procesar',
                                    message: `Existen ${result.count} empleado(s) con horas extras sin procesar en el periodo actual. ¿Desea continuar con el cambio de periodo?`,
                                    confirmText: 'Continuar',
                                    cancelText: 'Cancelar',
                                    confirmColor: 'warn'
                                }
                            });

                            dialogRef.afterClosed().subscribe(confirmed => {
                                if (confirmed) {
                                    this.applyPeriodChange(id);
                                }
                            });
                        } else {
                            this.applyPeriodChange(id);
                        }
                    },
                    error: () => {
                        this.applyPeriodChange(id);
                    }
                });
        } else {
            this.applyPeriodChange(id);
        }
    }

    private applyPeriodChange(id: number): void {
        this.activePeriod = id;
        window.localStorage.setItem(SysKey.ActiveNumPeriod, id.toString());
        this.get();
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

        const filter: IFilterReports = {
            page: 1,
            pageSize: 30,
            payroll: this.payroll?.typeNom || undefined,
            numPeriod: this.period?.numPeriod,
            search: this.searchControl.value || '',
            ...(this.filterForDates.value.start && this.filterForDates.value.end ? {
                filterDates: {
                    start: this.filterForDates.value.start!,
                    end: this.filterForDates.value.end!,
                }
            } : {})
        };

        const isPdf = typeFileDownload === TypeFileDownload.PDF;
        const extension = isPdf ? 'pdf' : 'xlsx';

        const serviceBySection: Record<number, () => Observable<HttpResponse<Blob>>> = isPdf
            ? {
                [Section.Delays]: () => this.reportsService.downloadPdfDelays(filter),
                [Section.Overtimes]: () => this.reportsService.downloadPdfOvertimes(filter),
                [Section.HoursWorked]: () => this.reportsService.downloadPdfHoursWorked(filter),
                [Section.Attendance]: () => this.reportsService.downloadPdfAttendance(filter),
                [Section.Incidences]: () => this.reportsService.downloadPdfIncidences(filter),
                [Section.Abandonment]: () => this.reportsService.downloadPdfAbandonment(filter),
            }
            : {
                [Section.Delays]: () => this.reportsService.downloadExcelDelays(filter),
                [Section.Overtimes]: () => this.reportsService.downloadExcelOvertimes(filter),
                [Section.HoursWorked]: () => this.reportsService.downloadExcelHoursWorked(filter),
                [Section.Attendance]: () => this.reportsService.downloadExcelAttendance(filter),
                [Section.Incidences]: () => this.reportsService.downloadExcelIncidences(filter),
                [Section.Abandonment]: () => this.reportsService.downloadExcelAbandonment(filter),
            };

        const buildService = serviceBySection[this.activeSection()];

        if (!buildService) {
            return;
        }

        this.appConfigService.setLoading(true);

        buildService().pipe(finalize(() => {
            this.appConfigService.setLoading(false);
        })).subscribe({
            next: (response) => {
                const urlBlob = window.URL.createObjectURL(new Blob([response.body!]));
                const link = document.createElement('a');
                link.href = urlBlob;
                link.download = this.buildReportFileName(extension);
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

    public toggleOnlyWithoutCheckOut(): void {
        this.onlyWithoutCheckOut.set(!this.onlyWithoutCheckOut());
        this.applyAttendanceFilters();
    }

    private applyAttendanceFilters(): void {
        const data = this.onlyWithoutCheckOut()
            ? this.allAttendance.filter((row) => !row.checkOut || row.checkOut === '--:--' || row.checkOut === 'N/A')
            : this.allAttendance;
        this.attendance.data = data;
        this.totalAttendanceRecords = data.length;
        this.attendancePageSize = 30;
    }

    public get activeCompanyName(): string {
        return this.authService.getActiveCompanyName();
    }

    public get activeTenantName(): string {
        return this.authService.getActiveTenantName();
    }

    private buildReportFileName(extension: string): string {
        const baseBySection: Record<number, string> = {
            [Section.Delays]: 'reporte_retardos',
            [Section.Overtimes]: 'reporte_horas_extras',
            [Section.HoursWorked]: 'reporte_horas_laboradas',
            [Section.Attendance]: 'reporte_asistencia',
            [Section.Incidences]: 'reporte_incidencias',
            [Section.Abandonment]: 'reporte_abandono',
        };
        const base = baseBySection[this.activeSection()] ?? 'reporte';
        return buildReportFileName(base, {
            tenant: this.authService.getActiveTenantName(),
            period: this.period?.numPeriod,
            year: this.authService.year.value
        }, extension);
    }

    private getDelays(search: string = '', filterDates?: { start: Date; end: Date }): void {
        this.appConfigService.setLoading(true);
        this.reportsService.getDelays({
            page: 1,
            pageSize: 30,
            payroll: this.payroll?.typeNom || undefined,
            numPeriod: this.period?.numPeriod,
            search: search || this.searchControl.value || '',
            filterDates,
        }).pipe(finalize(() => {
            this.appConfigService.setLoading(false);
        })).subscribe({
            next: (response) => {
                this.delays.data = response;
                this.totalDelayRecords = response.length;
                this.delayPageSize = 30;
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

    private getOvertimes(search: string = '', filterDates?: { start: Date; end: Date }): void {
        this.appConfigService.setLoading(true);
        this.reportsService.getOvertimes({
            page: 1,
            pageSize: 30,
            payroll: this.payroll?.typeNom || undefined,
            numPeriod: this.period?.numPeriod,
            search: search || this.searchControl.value || '',
            filterDates,
        }).pipe(finalize(() => {
            this.appConfigService.setLoading(false);
        })).subscribe({
            next: (response) => {
                this.overtimes.data = response;
                this.totalOvertimeRecords = response.length;
                this.overtimePageSize = 30;
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

    private getHoursWorked(search: string = '', filterDates?: { start: Date; end: Date }): void {
        this.appConfigService.setLoading(true);
        this.reportsService.getHoursWorked({
            page: 1,
            pageSize: 30,
            payroll: this.payroll?.typeNom || undefined,
            numPeriod: this.period?.numPeriod,
            search: search || this.searchControl.value || '',
            filterDates,
        }).pipe(finalize(() => {
            this.appConfigService.setLoading(false);
        })).subscribe({
            next: (response) => {
                this.hoursWorked.data = response;
                this.totalHoursWorkedRecords = response.length;
                this.hoursWorkedPageSize = 30;
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

    private getAttendance(search: string = '', filterDates?: { start: Date; end: Date }): void {
        this.appConfigService.setLoading(true);
        this.reportsService.getAttendance({
            page: 1,
            pageSize: 30,
            payroll: this.payroll?.typeNom || undefined,
            numPeriod: this.period?.numPeriod,
            search: search || this.searchControl.value || '',
            filterDates,
        }).pipe(finalize(() => {
            this.appConfigService.setLoading(false);
        })).subscribe({
            next: (response) => {
                this.allAttendance = response;
                this.applyAttendanceFilters();
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

    private getIncidences(search: string = '', filterDates?: { start: Date; end: Date }): void {
        this.appConfigService.setLoading(true);
        this.reportsService.getIncidences({
            page: 1,
            pageSize: 30,
            payroll: this.payroll?.typeNom || undefined,
            numPeriod: this.period?.numPeriod,
            search: search || this.searchControl.value || '',
            filterDates,
        }).pipe(finalize(() => {
            this.appConfigService.setLoading(false);
        })).subscribe({
            next: (response) => {
                this.incidences.data = response.sort((a, b) => {
                    if (a.code !== b.code) {
                        return a.code - b.code;
                    }

                    return dayjs(a.date).valueOf() - dayjs(b.date).valueOf();
                });
                this.totalIncidencesRecords = response.length;
                this.incidencesPageSize = 30;
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

    private getAbandonment(search: string = '', filterDates?: { start: Date; end: Date }): void {
        this.appConfigService.setLoading(true);
        this.reportsService.getAbandonment({
            page: 1,
            pageSize: 30,
            payroll: this.payroll?.typeNom || undefined,
            numPeriod: this.period?.numPeriod,
            search: search || this.searchControl.value || '',
            filterDates,
        }).pipe(finalize(() => {
            this.appConfigService.setLoading(false);
        })).subscribe({
            next: (response) => {
                this.abandonment.data = response;
                this.totalAbandonmentRecords = response.length;
                this.abandonmentPageSize = 30;
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