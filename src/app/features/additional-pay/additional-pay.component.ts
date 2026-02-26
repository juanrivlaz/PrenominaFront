import { CommonModule } from '@angular/common';
import {
  Component,
  inject,
  OnInit,
  signal,
  ViewEncapsulation,
  WritableSignal,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { SysKey } from '@core/models/enum/sys-key';
import { IPayroll } from '@core/models/payroll.interface';
import { IPeriodStatus } from '@core/models/period-status.interface';
import { IPrenominaPeriod } from '@core/models/prenomina-period.interface';
import { AppConfigService } from '@core/services/app-config/app-config.service';
import { AvatarComponent } from '@shared/components/avatar/avatar.component';
import { MaterialModule } from '@shared/modules/material/material.module';
import { AdditionalPayService } from './additional-pay.service';
import { finalize } from 'rxjs';
import { IAdditionalPay } from '@core/models/additional-pay/additional-pay.interface';
import { TypeFileDownload } from '@core/models/enum/type-file-download';

@Component({
  selector: 'app-additional-pay',
  imports: [
    CommonModule,
    MaterialModule,
    AvatarComponent,
    MatTableModule,
    MatMenuModule,
  ],
  providers: [AdditionalPayService],
  templateUrl: './additional-pay.component.html',
  styleUrl: './additional-pay.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class AdditionalPayComponent implements OnInit {
  private readonly _snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  public listPayrolls: WritableSignal<Array<IPayroll>> = signal<
    Array<IPayroll>
  >([]);
  public listPeriodStatus: WritableSignal<Array<IPeriodStatus>> = signal<
    Array<IPeriodStatus>
  >([]);
  private _listPeriods: WritableSignal<Array<IPrenominaPeriod>> = signal<
    Array<IPrenominaPeriod>
  >([]);
  public activePeriod: number = 0;
  public activePayroll: number = 0;
  public dataSource: MatTableDataSource<IAdditionalPay> = new MatTableDataSource<IAdditionalPay>([]);
  public columns: Array<string> = [
    'employee',
    'date',
    'incidentCode',
    'column',
    'baseValue',
    'operator',
    'operationValue',
    'total',
  ];

  constructor(
    private readonly configService: AppConfigService,
    private readonly additionalPayService: AdditionalPayService
  ) {
    const storageTypeNom = window.sessionStorage.getItem(SysKey.ActiveTypeNom);
    if (storageTypeNom) {
      this.setPayroll(+storageTypeNom);
    }

    const storageNumPeriod = window.sessionStorage.getItem(
      SysKey.ActiveNumPeriod,
    );
    if (storageNumPeriod) {
      const periodValue = +storageNumPeriod;

      setTimeout(() => {
        this.setPeriod(periodValue);
      }, 800);
    }
  }

  ngOnInit(): void {
    this.getInit();
  }

  private getInit(): void {
    this.configService.setLoading(true);
    this.additionalPayService.getInit().pipe(finalize(() => {
      this.configService.setLoading(false);
    })).subscribe({
      next: (response) => {
        this.listPayrolls.set(response.payrolls);
        this.listPeriodStatus.set(response.periodStatus);
        this._listPeriods.set(response.periods);
      },
      error: (err) => {
        const message = err.error?.message || 'Ocurrió un error, por favor intentalo más tarde';

        this.showMessage(
          message,
          true,
        );
      }
    });
  }

  private get(): void {
    if (!this.payroll) {
      this.showMessage('Selecciona un tipo de nómina', true);
      return;
    }

    if (!this.period) {
      this.showMessage('Selecciona un periodo', true);
      return;
    }

    this.configService.setLoading(true);
    this.additionalPayService.getAdditionalPays(this.payroll.typeNom, this.period.numPeriod).pipe(finalize(() => {
      this.configService.setLoading(false);
    })).subscribe({
      next: (response) => {
        this.dataSource = new MatTableDataSource<IAdditionalPay>(response || []);
      },
      error: (err) => {
        const message = err.error?.message || 'Ocurrió un error, por favor intentalo más tarde';

        this.showMessage(
          message,
          true,
        );
      }
    });
  }

  public handleChangeSearch(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  public get listPeriods(): Array<IPrenominaPeriod> {
    return this._listPeriods().filter(
      (item) => item.typePayroll === this.activePayroll,
    );
  }

  public get payroll(): IPayroll | undefined {
    return this.listPayrolls().find(
      (item) => item.typeNom === this.activePayroll,
    );
  }

  public setPayroll(id: number): void {
    this.activePayroll = id;
    window.sessionStorage.setItem(SysKey.ActiveTypeNom, id.toString());
  }

  public get period(): IPrenominaPeriod | undefined {
    return this.listPeriods.find(
      (item) => item.numPeriod === this.activePeriod,
    );
  }

  public setPeriod(id: number): void {
    this.activePeriod = id;
    window.sessionStorage.setItem(SysKey.ActiveNumPeriod, id.toString());
    this.get();
  }

  public downloadReport(typeFileDownload: TypeFileDownload): void {
    if (!this.payroll) {
      this.showMessage('Selecciona un tipo de nómina', true);
      return;
    }

    if (!this.period) {
      this.showMessage('Selecciona un periodo', true);
      return;
    }

    this.configService.setLoading(true);
    this.additionalPayService.downloadAdditionalPays(this.payroll.typeNom, this.period.numPeriod, typeFileDownload).pipe(finalize(() => {
      this.configService.setLoading(false);
    })).subscribe({
      next: (response) => {
        const urlBlob = window.URL.createObjectURL(new Blob([response]));
        const link = document.createElement('a');
        link.href = urlBlob;
        var type = typeFileDownload === TypeFileDownload.XLSX ? 'xlsx' : 'pdf';
        link.download = `pagos_adicionales.${type}`;
        link.click();

        window.URL.revokeObjectURL(urlBlob);
      },
      error: (err) => {
        const message = err.error?.message || 'Ocurrió un error, por favor intentalo más tarde';
        
        this.showMessage(
          message,
          true,
        );
      }
    });
  }

  private showMessage(message: string, isError: boolean): void {
    this._snackBar.open(
      message,
      isError ? '❌' : '✅',
      {
        horizontalPosition: 'center',
        verticalPosition: 'top',
        panelClass: isError ? 'alert-error' : 'alert-success',
        duration: 3000
      },
    );
  }
}
