import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { IClockUser } from "@core/models/clock-user.interface";
import { IClock } from "@core/models/clock.interface";
import { CreateClock } from "@core/models/create-clock";
import { Observable } from "rxjs";

@Injectable()
export class ClocksService {
    constructor(private readonly httpService: HttpClient) {}

    public get(): Observable<Array<IClock>> {
        return this.httpService.get<Array<IClock>>('/Clocks');
    }

    public create(form: CreateClock): Observable<IClock> {
        return this.httpService.post<IClock>('/Clocks', form);
    }

    public sendPing(form: { IP: string}): Observable<boolean> {
        return this.httpService.post<boolean>('/Clocks/send-ping', form);
    }

    public getClockUser(clockId: string): Observable<Array<IClockUser>> {
        return this.httpService.get<Array<IClockUser>>(`/Clocks/get-clock-user/${clockId}`);
    }

    public syncClockUserToDB(clockId: string): Observable<boolean> {
        return this.httpService.post<boolean>(`/Clocks/sync-clock-user-to-bd/${clockId}`, {});
    }

    public syncClockAttendace(clockId: string): Observable<boolean> {
        return this.httpService.post<boolean>(`/Clocks/sync-clock-attendance/${clockId}`, {});
    }
}