import { CommonModule } from "@angular/common";
import { Component, inject, model, OnInit, signal, ViewChild, ViewEncapsulation, WritableSignal } from "@angular/core";
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
import { AuthService } from "@core/services/auth/auth.service";
import { combineLatest, debounceTime, finalize } from "rxjs";
import { IAttendanceReport } from "@core/models/reports/attendance.interface";
import { AttendanceTableComponent } from "./attendance-table/attendance-table.component";
import { MatDatepicker, MatDatepickerModule } from "@angular/material/datepicker";

@Component({
    selector: 'app-reports',
    imports: [
        CommonModule,
        MaterialModule,
        MatChipsModule,
        MatDividerModule,
        MatMenuModule,
        ReactiveFormsModule,
        DelaysTableComponent,
        HoursWorkedTableComponent,
        OvertimesTableComponent,
        AttendanceTableComponent,
        MatDatepickerModule
    ],
    providers: [ReportsService],
    templateUrl: './reports.component.html',
    styleUrl: './reports.component.scss',
    animations: appAnimations,
    encapsulation: ViewEncapsulation.None,
})
export class ReportsComponent implements OnInit {
    @ViewChild('dateFilter') picker!: MatDatepicker<Date>;

    private readonly _snackBar = inject(MatSnackBar);
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
    
    public constructor(
        private readonly appConfigService: AppConfigService,
        private readonly authService: AuthService,
        private readonly reportsService: ReportsService,
    ) {}

    ngOnInit(): void {
        combineLatest([this.authService.activeCompany, this.authService.activeTenant]).subscribe(() => {
            this.getInit();
        });

        this.searchControl.valueChanges.pipe(debounceTime(1200)).subscribe((value) => {
            this.get(value ?? '');
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

        this.filterForDates.valueChanges.subscribe((value) => {
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
        this.picker.open();
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
        window.sessionStorage.setItem(SysKey.ActiveTypeNom, id.toString());
    }

    public get listPeriods(): Array<IPrenominaPeriod> {
        return this._listPeriods().filter((item) => item.typePayroll === this.activePayroll);
    }

    public get period(): IPrenominaPeriod | undefined {
        return this.listPeriods.find((item) => item.numPeriod === this.activePeriod);
    }

    public setPeriod(id: number): void {
        this.activePeriod = id;
        window.sessionStorage.setItem(SysKey.ActiveNumPeriod, id.toString());
        this.get();
    }

    public downloadReport(typeFileDownload: TypeFileDownload): void {
        if (typeFileDownload === 0) {
            return;
        }

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

        this.appConfigService.setLoading(true);
        var service;
        if (this.activeSection() === Section.Delays) {
            service = this.reportsService.downloadExcelDelays(
            {
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
            });
        } else if (this.activeSection() === Section.Overtimes) {
            service = this.reportsService.downloadExcelOvertimes(
            {
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
            });
        } else if (this.activeSection() === Section.HoursWorked) {
            service = this.reportsService.downloadExcelHoursWorked(
            {
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
            });
        } else if (this.activeSection() === Section.Attendance) {
            service = this.reportsService.downloadExcelAttendance(
            {
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
            });
        }

        if (!service) {
            this.appConfigService.setLoading(false);
            return;
        }

        service.pipe(finalize(() => {
            this.appConfigService.setLoading(false);
        })).subscribe({
            next: (response) => {
                const urlBlob = window.URL.createObjectURL(new Blob([response.body!]));
                const link = document.createElement('a');
                link.href = urlBlob;
                link.download = this.reportsService.getHttpResponseFileName(response, `report.xlsx`);
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
                this.attendance.data = response;
                this.totalAttendanceRecords = response.length;
                this.attendancePageSize = 30;
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