import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { TypeFileDownload } from "@core/models/enum/type-file-download";
import { IPayroll } from "@core/models/payroll.interface";
import { IPrenominaPeriod } from "@core/models/prenomina-period.interface";
import { IWorkedDayOffs } from "@core/models/worked-day-offs.interface";
import { Observable } from "rxjs";

@Injectable()
export class SundayBonusService {
    constructor(private readonly httpService: HttpClient) {}

    public getWorkedDays(payrollId: number, numberPeriod: number): Observable<Array<IWorkedDayOffs>> {
        return this.httpService.get<Array<IWorkedDayOffs>>('/DayOffs/worked-sunday', {
            params: {
                payrollId,
                numberPeriod
            }
        });
    }

    public downloadWorkedDays(payrollId: number, numberPeriod: number, typeFileDownload: TypeFileDownload): Observable<Blob> {
        return this.httpService.get('/DayOffs/worked-sunday/download', {
            responseType: 'blob',
            params: {
                payrollId,
                numberPeriod,
                typeFileDownload
            }
        });
    }

    public getPayrolls(): Observable<Array<IPayroll>> {
        return this.httpService.get<Array<IPayroll>>('/Period/payrolls');
    }

    public getPeriods(typePayroll: number): Observable<Array<IPrenominaPeriod>> {
        return this.httpService.get<Array<IPrenominaPeriod>>('/Period', {
            params: {
                typePayroll,
            },
        });
    }
}