import { CommonModule } from "@angular/common";
import { Component, inject, OnInit, signal, ViewEncapsulation, WritableSignal } from "@angular/core";
import { MatMenuModule } from "@angular/material/menu";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { PeriodService } from "./period.service";
import { IPayroll } from "../../core/models/payroll.interface";
import { finalize } from "rxjs";
import { MatSnackBar } from "@angular/material/snack-bar";
import { IPrenominaPeriod } from "../../core/models/prenomina-period.interface";
import { MatTableDataSource, MatTableModule } from "@angular/material/table";
import { AppConfigService } from "../../core/services/app-config/app-config.service";
import { SysKey } from "../../core/models/enum/sys-key";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatDialog } from "@angular/material/dialog";
import { ChangeStatusComponent } from "./change-status/change-status.component";
import { MaterialModule } from "../../shared/modules/material/material.module";
import { IChangeStatusOutput } from "./change-status/change-status-output.interface";
import { IChangeStatus } from "./change-status/change-status.interface";

@Component({
    selector: 'app-period',
    imports: [
        CommonModule,
        MaterialModule,
        MatMenuModule,
        MatProgressBarModule,
        MatTableModule,
        MatTooltipModule,
    ],
    providers: [PeriodService],
    templateUrl: 'period.component.html',
    styleUrl: 'period.component.scss',
    encapsulation: ViewEncapsulation.None
})
export class PeriodComponent implements OnInit {
    private readonly _snackBar = inject(MatSnackBar);
    private readonly dialog = inject(MatDialog);
    public loading: WritableSignal<boolean> = signal(true);
    public listPayrolls: WritableSignal<Array<IPayroll>> = signal([]);
    public listPeriods: MatTableDataSource<IPrenominaPeriod> = new MatTableDataSource<IPrenominaPeriod>([]);
    public activePayroll: number = 0;
    public columnTable: Array<string> = [
        'number',
        'startOfCut',
        'closeOfCut',
        'days',
        'start',
        'close',
        'pay',
        'status'
    ];

    constructor(
        private readonly service: PeriodService,
        private readonly configService: AppConfigService,
    ) {}

    public ngOnInit(): void {
        this.getIni();
    }

    public get payroll(): IPayroll | undefined {
        return this.listPayrolls().find((item) => item.typeNom === this.activePayroll);
    }

    public setPayroll(id: number): void {
        this.activePayroll = id;
        this.getPeriods();
        window.sessionStorage.setItem(SysKey.ActiveTypeNom, id.toString());
    }

    public onFileSelected(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            const file = input.files[0];
            this.storePeriodByFile(file);
        }
    }

    public changeStatusPeriod(period: IPrenominaPeriod): void {
        const dialogRef = this.dialog.open<ChangeStatusComponent, IChangeStatus>(ChangeStatusComponent, {
            data: {
                ...period,
                service: this.service
            }
        });

        dialogRef.afterClosed().subscribe((result: IChangeStatusOutput) => {
            if (result.confirm) {
                this._snackBar.open('El periodo cambió de estatus correctamente', '✅', {
                    horizontalPosition: 'center',
                    verticalPosition: 'top',
                    panelClass: 'alert-success',
                    duration: 3000
                });
                
                this.getPeriods();
            } else {
                if (result.errorMessage) {
                    this._snackBar.open(result.errorMessage, '❌', {
                        horizontalPosition: 'center',
                        verticalPosition: 'top',
                        panelClass: 'alert-error',
                        duration: 3000
                    });
                }
            }
        });
    }

    private getIni(): void {
        this.configService.setLoading(true);
        this.service.getPayrolls().pipe(finalize(() => {
            this.configService.setLoading(false);

            const storageTypeNom = window.sessionStorage.getItem(SysKey.ActiveTypeNom);
            if (storageTypeNom) {
                this.setPayroll(parseInt(storageTypeNom, 10));
            }
        })).subscribe({
            next: (response) => {
                this.listPayrolls.set(response);
            },
            error: this.errorHttp
        });
    }

    private errorRequiredPayroll(): void {
        this._snackBar.open('Selecciona un tipo de nómina', '⚠️', {
            horizontalPosition: 'center',
            verticalPosition: 'top',
            panelClass: 'alert-error',
            duration: 3000
        });
    }

    private errorHttp(err: any): void {
        const message = err.error?.message || 'Ocurrió un error, por favor intentalo más tarde';

        this._snackBar.open(message, '❌', {
            horizontalPosition: 'center',
            verticalPosition: 'top',
            panelClass: 'alert-error',
            duration: 3000
        });
    }

    private getPeriods(): void {
        if (!this.payroll) {
            this.errorRequiredPayroll();

            return;
        }

        this.configService.setLoading(true);
        this.service.get(this.payroll?.typeNom).pipe(finalize(() => {
            this.configService.setLoading(false);
        })).subscribe({
            next: (response) => {
                this.listPeriods = new MatTableDataSource<IPrenominaPeriod>(response.sort((a, b) => a.numPeriod - b.numPeriod));
            },
            error: this.errorHttp
        });
    }

    private storePeriodByFile(file: File): void {
        if (!this.payroll) {
            this.errorRequiredPayroll();

            return;
        }

        this.configService.setLoading(true);
        this.service.storeByFile(this.payroll?.typeNom, file).pipe(finalize(() => {
            this.configService.setLoading(false);
        })).subscribe({
            next: (response) => {
                this.listPeriods = new MatTableDataSource<IPrenominaPeriod>(response.sort((a, b) => a.numPeriod - b.numPeriod));
            },
            error: this.errorHttp
        });
    }
}