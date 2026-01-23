import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { IDayOffs } from "@core/models/day-offs.interface";
import { TypeFileDownload } from "@core/models/enum/type-file-download";
import { IWorkedDayOffs } from "@core/models/worked-day-offs.interface";
import { Observable } from "rxjs";

@Injectable()
export class WorkedDayOffService {
    constructor(private readonly httpService: HttpClient) {}

    public getWorkedDays(dayOffId: string): Observable<Array<IWorkedDayOffs>> {
        return this.httpService.get<Array<IWorkedDayOffs>>('/DayOffs/worked-days', {
            params: {
                dayOffId,
            }
        });
    }

    public downloadWorkedDays(dayOffId: string, typeFileDownload: TypeFileDownload): Observable<Blob> {
        return this.httpService.get('/DayOffs/worked-days/download', {
            responseType: 'blob',
            params: {
                dayOffId,
                typeFileDownload
            }
        });
    }

    public get(): Observable<Array<IDayOffs>> {
        return this.httpService.get<Array<IDayOffs>>('/DayOffs');
    }
}