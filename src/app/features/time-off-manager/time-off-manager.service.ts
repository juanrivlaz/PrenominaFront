import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { IEmployessDayOff } from "@core/models/employees-day-off.interface";
import { IPagedResult } from "@core/models/paged-result.interface";
import { Observable } from "rxjs";
import { IAssignTimeOff } from "./assign-time-off/assign-time-off.interface";
import { ISyncIncapacityOutput } from "@core/models/sync-incapacity-output.interface";

@Injectable()
export class TimeOffManagerService {
    constructor(
        private readonly httpService: HttpClient,
    ) {}

    public getEmployeeByPayroll(typeNom: number, page: number = 1, search: string = ''): Observable<IPagedResult<IEmployessDayOff>> {
        return this.httpService.get<IPagedResult<IEmployessDayOff>>('/DayOffs/get-employees', {
            params: {
                TypeNom: typeNom,
                Page: page,
                PageSize: 30,
                Search: search || ''
            }
        });
    }

    public registerToUser(form: Pick<IAssignTimeOff, 'employeeCode'> & { incidentCode: string, dates: Array<string> }): Observable<IEmployessDayOff> {
        return this.httpService.post<IEmployessDayOff>('/DayOffs/register-to-user', form);
    }

    public syncIncapacity(form: {
        TypeNom: number;
        PeriodId: string;
        TenantId: string;
    }): Observable<ISyncIncapacityOutput> {
        return this.httpService.post<ISyncIncapacityOutput>('/DayOffs/sync-incapacity', form);
    }
}