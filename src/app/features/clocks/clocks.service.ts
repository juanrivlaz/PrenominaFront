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

    public update(id: string, form: CreateClock): Observable<IClock> {
        return this.httpService.put<IClock>(`/Clocks/${id}`, form);
    }

    public delete(id: string): Observable<boolean> {
        return this.httpService.delete<boolean>(`/Clocks/${id}`);
    }

    public sendPing(form: { IP: string}): Observable<boolean> {
        return this.httpService.post<boolean>('/Clocks/send-ping', form);
    }

    public getClockUser(clockId: string): Observable<Array<IClockUser>> {
        return this.httpService.get<Array<IClockUser>>(`/Clocks/get-clock-user/${clockId}`);
    }

    public getDbUsers(): Observable<Array<IClockUser>> {
        return this.httpService.get<Array<IClockUser>>('/Clocks/db-users');
    }

    public syncClockUserToDB(clockId: string): Observable<boolean> {
        return this.httpService.post<boolean>(`/Clocks/sync-clock-user-to-bd/${clockId}`, {});
    }

    public syncClockAttendace(clockId: string): Observable<boolean> {
        return this.httpService.post<boolean>(`/Clocks/sync-clock-attendance/${clockId}`, {});
    }

    public syncDbToClock(clockId: string, enrollNumbers?: Array<string>): Observable<{ totalUsers: number; message: string }> {
        return this.httpService.post<{ totalUsers: number; message: string }>(`/Clocks/sync-db-to-clock/${clockId}`, { enrollNumbers });
    }

    public syncClockToClock(sourceClockId: string, targetClockId: string, enrollNumbers?: Array<string>): Observable<{ totalUsers: number; message: string }> {
        return this.httpService.post<{ totalUsers: number; message: string }>('/Clocks/sync-clock-to-clock', { sourceClockId, targetClockId, enrollNumbers });
    }
}