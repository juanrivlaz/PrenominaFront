import { CommonModule } from "@angular/common";
import { Component, inject, OnInit, signal, ViewEncapsulation, WritableSignal } from "@angular/core";
import { MatMenuModule } from "@angular/material/menu";
import { MatSnackBar } from "@angular/material/snack-bar";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MaterialModule } from "@shared/modules/material/material.module";
import { finalize } from "rxjs";
import { SundayBonusService } from "./sunday-bonus.service";
import { IPayroll } from "@core/models/payroll.interface";
import { IPrenominaPeriod } from "@core/models/prenomina-period.interface";
import { DatesService } from "@core/services/dates/dates.service";
import { MatTableDataSource, MatTableModule } from "@angular/material/table";
import { IWorkedDayOffs } from "@core/models/worked-day-offs.interface";
import { TypeFileDownload } from "@core/models/enum/type-file-download";
import { SysKey } from "@core/models/enum/sys-key";
import { AppConfigService } from "@core/services/app-config/app-config.service";

@Component({
    selector: 'app-sunday-bonus',
    imports: [
        CommonModule,
        MaterialModule,
        MatMenuModule,
        MatTooltipModule,
        MatTableModule
    ],
    providers: [SundayBonusService, DatesService],
    templateUrl: './sunday-bonus.component.html',
    styleUrl: './sunday-bonus.component.scss',
    encapsulation: ViewEncapsulation.None
})
export class SundayBonusComponent implements OnInit {
    private readonly snackBar = inject(MatSnackBar);
    private _listPeriods: WritableSignal<Array<IPrenominaPeriod>> = signal([]);
    public loading: WritableSignal<boolean> = signal(true);
    public listPayrolls: WritableSignal<Array<IPayroll>> = signal([]);
    public columnTable: Array<string> = [
        'code',
        'name',
        'activity',
        'salary',
        'date',
        'numConcept',
        'amount'
    ];
    public listWorkedDayOffs: MatTableDataSource<IWorkedDayOffs> = new MatTableDataSource<IWorkedDayOffs>([]);
    public activePayroll: WritableSignal<number> = signal(0);
    public activePeriod: WritableSignal<number> = signal(0);
    public listDates: WritableSignal<Array<{
        day: string,
        date: string,
        label: string,
        key: number,
    }>> = signal([]);

    constructor(
        private readonly dateService: DatesService,
        private readonly service: SundayBonusService,
        private readonly configService: AppConfigService
    ) {}

    ngOnInit(): void {
        this.getPayrolls();

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

    public get payroll(): IPayroll | undefined {
        return this.listPayrolls().find((item) => item.typeNom === this.activePayroll());
    }

    public get listPeriods(): Array<IPrenominaPeriod> {
        return this._listPeriods().filter((item) => item.typePayroll === this.activePayroll());
    }

    public get period(): IPrenominaPeriod | undefined {
        return this.listPeriods.find((item) => item.numPeriod === this.activePeriod());
    }

    public setPayroll(id: number): void {
        if (id === this.activePayroll()) {
            return;
        }

        this.activePayroll.set(id);
        this.listDates.set([]);
        this.setPeriod(0, true);
        this.getPeriods(id);
        window.sessionStorage.setItem(SysKey.ActiveTypeNom, id.toString());
    }

    public setPeriod(id: number, noAlert = false): void {
        this.activePeriod.set(id);

        if (!this.period) {
            if (!noAlert) {
                this.snackBar.open('Selecciona un periodo', undefined, {
                    horizontalPosition: 'center',
                    verticalPosition: 'top',
                    panelClass: 'alert-error',
                    duration: 3000
                });
            }

            return;
        }

        window.sessionStorage.setItem(SysKey.ActiveNumPeriod, id.toString());
        this.listDates.set(this.dateService.generateFechas(this.period.startDate, this.period.closingDate));
        this.getWorkedSundays();
    }

    public handleChangeSearch(event: Event): void {
        const filterValue = (event.target as HTMLInputElement).value;
        this.listWorkedDayOffs.filter = filterValue.trim().toLowerCase();
    }

    public downloadWorkedDays(typeFileDownload: number): void {
        this.loading.set(true);
        this.service.downloadWorkedDays(this.activePayroll(), this.activePeriod(), typeFileDownload).pipe(finalize(() => {
            this.loading.set(false);
        })).subscribe({
            next: (response) => {
                const urlBlob = window.URL.createObjectURL(new Blob([response]));
                const link = document.createElement('a');
                link.href = urlBlob;
                var type = typeFileDownload === TypeFileDownload.XLSX ? 'xlsx' : 'pdf';
                link.download = `worked-sunday.${type}`;
                link.click();

                window.URL.revokeObjectURL(urlBlob);
            },
            error: (err) => {
                const message = err.error?.message || 'Ocurrió un error, por favor intentalo más tarde';

                this.snackBar.open(message, undefined, {
                  horizontalPosition: 'center',
                  verticalPosition: 'top',
                  panelClass: 'alert-error',
                  duration: 3000
                });
            }
        });
    }

    private getPayrolls(): void {
        this.loading.set(true);
        this.service.getPayrolls().pipe(finalize(() => {
            this.loading.set(false);
        })).subscribe({
            next: (response) => {
                this.listPayrolls.set(response);
            },
            error: (err) => {
                const message = err.error?.message || 'Ocurrió un error, por favor intentalo más tarde';

                this.snackBar.open(message, undefined, {
                  horizontalPosition: 'center',
                  verticalPosition: 'top',
                  panelClass: 'alert-error',
                  duration: 3000
                });
            }
        });
    }

    private getPeriods(payrollId: number): void {
        this.loading.set(true);
        this.service.getPeriods(payrollId).pipe(finalize(() => {
            this.loading.set(false);
        })).subscribe({
            next: (response) => {
                this._listPeriods.set(response.sort((a, b) => a.numPeriod - b.numPeriod));
            },
            error: (err) => {
                console.log({
                    err
                });
            }
        });
    }

    private getWorkedSundays(): void {
        this.configService.setLoading(true);
        this.service.getWorkedDays(this.activePayroll(), this.activePeriod()).pipe(finalize(() => {
            this.configService.setLoading(false);
        })).subscribe({
            next: (response) => {
                this.listWorkedDayOffs = new MatTableDataSource<IWorkedDayOffs>(response);
            },
            error: (err) => {
                const message = err.error?.message || 'Ocurrió un error, por favor intentalo más tarde';

                this.snackBar.open(message, undefined, {
                  horizontalPosition: 'center',
                  verticalPosition: 'top',
                  panelClass: 'alert-error',
                  duration: 3000
                });
            }
        })
    }
}