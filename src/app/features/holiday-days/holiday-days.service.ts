import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { IDayOffs } from "@core/models/day-offs.interface";
import { Observable } from "rxjs";
import { IFormHoliday } from "./create-holiday/form-holiday.interface";
import dayjs from "dayjs";
import { IIncidentCode } from "@core/models/incident-code.interface";

@Injectable()
export class HolidayDaysService {
    constructor(private readonly httpService: HttpClient) {}

    public get(): Observable<Array<IDayOffs>> {
        return this.httpService.get<Array<IDayOffs>>('/DayOffs');
    }

    public submitCreate(form: IFormHoliday): Observable<IDayOffs> {
        return this.httpService.post<IDayOffs>('/DayOffs', {
            ...form,
            date: dayjs(form.date).format('YYYY-MM-DD')
        });
    }

    public submitEdit(form: IFormHoliday & { id: string }): Observable<IDayOffs> {
        return this.httpService.put<IDayOffs>('/DayOffs', {
            ...form,
            date: dayjs(form.date).format('YYYY-MM-DD')
        });
    }

    public getIncidents(): Observable<Array<IIncidentCode>> {
        return this.httpService.get<Array<IIncidentCode>>('/IncidentCode');
    }

    public deleteItem(id: string): Observable<IDayOffs> {
        return this.httpService.delete<IDayOffs>(`/DayOffs/${id}`);
    }
}