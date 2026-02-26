import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { IAdditionalPay } from '@core/models/additional-pay/additional-pay.interface';
import { TypeFileDownload } from '@core/models/enum/type-file-download';
import { IInitAttendanceRecords } from '@core/models/init-attendance-records.interface';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AdditionalPayService {
  constructor(private readonly httpService: HttpClient) {}

  public getInit(): Observable<IInitAttendanceRecords> {
    return this.httpService.get<IInitAttendanceRecords>('/attendance/init');
  }

  public getAdditionalPays(
    payroll: number,
    numPeriod: number,
  ): Observable<Array<IAdditionalPay>> {
    return this.httpService.get<Array<IAdditionalPay>>('/attendance/additional-pay', {
      params: {
        TypeNomina: payroll,
        NumPeriod: numPeriod,
      },
    });
  }

  public downloadAdditionalPays(
    payroll: number,
    numPeriod: number,
    typeFileDownload: TypeFileDownload
  ): Observable<Blob> {
    return this.httpService.get('/attendance/additional-pay/download', {
      responseType: 'blob',
      params: {
        TypeNomina: payroll,
        NumPeriod: numPeriod,
        typeFileDownload
      },
    });
  }
}
