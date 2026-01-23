import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { IPayroll } from "@core/models/payroll.interface";
import { IPrenominaPeriod } from "@core/models/prenomina-period.interface";
import { Observable } from "rxjs";

@Injectable()
export class PeriodService {
    constructor(private readonly httpService: HttpClient) {}

    public get(typePayroll: number): Observable<Array<IPrenominaPeriod>> {
        return this.httpService.get<Array<IPrenominaPeriod>>('/Period', {
            params: {
                TypePayroll: typePayroll,
            }
        });
    }

    public getPayrolls(): Observable<Array<IPayroll>> {
        return this.httpService.get<Array<IPayroll>>('/Period/payrolls');
    }

    public storeByFile(typePayroll: number, file: File): Observable<Array<IPrenominaPeriod>> {
        const formData = new FormData();
        formData.append('TypePayroll', typePayroll.toString());
        formData.append('File', file);

        return this.httpService.post<Array<IPrenominaPeriod>>('/Period/by-file', formData);
    }
}