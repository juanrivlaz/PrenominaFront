import { CommonModule } from "@angular/common";
import { Component, inject, model, OnInit, signal, ViewEncapsulation, WritableSignal } from "@angular/core";
import { AvatarComponent } from "../../shared/components/avatar/avatar.component";
import { MaterialModule } from "../../shared/modules/material/material.module";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatMenuModule } from "@angular/material/menu";
import { MatDialog } from "@angular/material/dialog";
import { AssignTimeOffComponent } from "./assign-time-off/assign-time-off.component";
import { IAssignTimeOff } from "./assign-time-off/assign-time-off.interface";
import { AttendaceService } from "../attendace/attendace.service";
import { AuthService } from "@core/services/auth/auth.service";
import { combineLatest, debounceTime, finalize } from "rxjs";
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
export class TimeOffManagerComponent implements OnInit {
    private readonly _snackBar = inject(MatSnackBar);
    private readonly dialog = inject(MatDialog);
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
        combineLatest([this.authService.activeCompany, this.authService.activeTenant]).subscribe(() => {
            this.getInit();
        });

        this.searchControl.valueChanges.pipe(debounceTime(1200)).subscribe((value) => {
            this.getEmployee(value);
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
    }

    public getInit(): void {
        this.configService.setLoading(true);
        this.serviceAttendace.getInit().pipe(finalize(() => {
            this.configService.setLoading(false);
        })).subscribe({
            next: (response) => {
                const now = dayjs();
                this.listPayrolls.set(response.payrolls);
                this._listPeriods.set(response.periods);//.filter((item) => (dayjs(item.startAdminDate) <= now && dayjs(item.closingAdminDate) >= now) || dayjs(item.startAdminDate) >= now));
                this.listIncidentCodes.set(response.incidentCodes.filter((item) => !item.isAdditional));
                this.listIncidentCodesAditional.set(response.incidentCodes.filter((item) => item.isAdditional));
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

    public getEmployee(search: string = ''): void {
        this.configService.setLoading(true);
        this.service.getEmployeeByPayroll(this.activePayroll(), this.paginatorDetails().page, search || this.searchControl.value).pipe(finalize(() => {
            this.configService.setLoading(false);
        })).subscribe({
            next: (response) => {
                this.listEmployees.set(response.items);

                const listAttendaceIncidents = response.items.map((employee) => employee.attendancesIncident.map((ai) => ({ key: `${employee.codigo}:${ai.date}`, code: ai.incidentCode}) )).flat();
                this.attendancesIncidents = new Map(listAttendaceIncidents.map((item) => [item.key, item.code]));
                this.paginatorDetails.set({
                    totalRecord: response.totalRecords,
                    pageSize: response.pageSize,
                    page: this.paginatorDetails().page
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

            // message error

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

        dialogRef.afterClosed().subscribe(result => {
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
                }).pipe(finalize(() => {
                    this.configService.setLoading(false);
                })).subscribe({
                    next: (result) => {
                        const currentEmployees = this.listEmployees().map((item) => {
                            if (item.codigo == result.codigo) {
                                return result;
                            }

                            return item;
                        });

                        this.listEmployees.set(currentEmployees);

                        result.attendancesIncident.forEach((item) => {
                            const key = `${result.codigo}:${item.date}`;
                            this.attendancesIncidents.set(key, item.incidentCode);
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

    public setPeriod(id: number, noAlert = false): void {
        this.activePeriod.set(id);

        if (!this.period) {
            if (!noAlert) {
                this._snackBar.open('Selecciona un periodo', '⚠️', {
                    horizontalPosition: 'center',
                    verticalPosition: 'top',
                    panelClass: 'alert-error',
                    duration: 3000
                });
            }

            return;
        }

        window.sessionStorage.setItem(SysKey.ActiveNumPeriod, id.toString());
        this.listDates.set(this.generarFechas(this.period.startAdminDate, this.period.closingAdminDate));
    }

    public setPayroll(id: number): void {
        if (id === this.activePayroll()) {
            return;
        }

        this.activePayroll.set(id);
        window.sessionStorage.setItem(SysKey.ActiveTypeNom, id.toString());
        setTimeout(() => {
            this.listDates.set([]);
            this.setPeriod(0, true);
            this.getEmployee();
        }, 200);
    }

    public getIncidentForDate(employeeCode: number, date: string) {
        return this.attendancesIncidents.get(`${employeeCode}:${date}`) || '';
    }

    public syncIncapacity(): void {
        if (!this.period) {
            this._snackBar.open('Selecciona un periodo', '⚠️', {
                horizontalPosition: 'center',
                verticalPosition: 'top',
                panelClass: 'alert-error',
                duration: 3000
            });

            return;
        }

        this.configService.setLoading(true);

        this.service.syncIncapacity({
            TypeNom: this.activePayroll(),
            PeriodId: this.period.id,
            TenantId: this.authService.activeTenant.value
        }).pipe(finalize(() => {
            this.configService.setLoading(false);
        })).subscribe({
            next: (result) => {
                this._snackBar.open(`Se han sincronizado ${result.totalIncapacities} incapacidades y ${result.totalVacations} vacaciones`, undefined, {
                    horizontalPosition: 'center',
                    verticalPosition: 'top',
                    panelClass: 'alert-success',
                    duration: 3500
                });
            },
            error: (err) => {
                console.log(err);
            }
        });
    }

    public handlePageEvent(e: PageEvent): void {
        this.paginatorDetails.update((state) => ({
            ...state,
            page: e.pageIndex + 1
        }));

        setTimeout(() => {
            this.getEmployee();
        }, 200);
    }

    private generarFechas(startDate: string | Date, endDate: string | Date): Array<{
        day: string,
        date: string,
        label: string,
        key: number
    }> {
        let dates = [];
        let start = dayjs(startDate);
        let end = dayjs(endDate);
    
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