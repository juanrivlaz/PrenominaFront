import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { IEmployessDayOff } from "@core/models/employees-day-off.interface";
import { IPagedResult } from "@core/models/paged-result.interface";
import { Observable } from "rxjs";
import { IAssignTimeOff } from "./assign-time-off/assign-time-off.interface";
import { ISyncIncapacityOutput } from "@core/models/sync-incapacity-output.interface";
import { IAssignTimeOffOutput } from "./assign-time-off/assign-time-off-output.interface";
import { IAssistanceIncident } from "@core/models/assistance-incident.interface";

@Injectable()
export class TimeOffManagerService {
    constructor(
        private readonly httpService: HttpClient,
    ) {}

    public getEmployeeByPayroll(typeNom: number, page: number = 1, search: string = '', numPeriod: number = 0): Observable<IPagedResult<IEmployessDayOff>> {
        const params: Record<string, string | number> = {
            TypeNom: typeNom,
            Page: page,
            PageSize: 30,
            Search: search || ''
        };
        if (numPeriod > 0) {
            params['NumPeriod'] = numPeriod;
        }
        return this.httpService.get<IPagedResult<IEmployessDayOff>>('/DayOffs/get-employees', { params });
    }

    public registerToUser(form: Pick<IAssignTimeOff, 'employeeCode'> & IAssignTimeOffOutput & { dates: Array<string> }): Observable<IEmployessDayOff> {
        return this.httpService.post<IEmployessDayOff>('/DayOffs/register-to-user', form);
    }

    public rejectDayOff(form: {
        employeeCode: number;
        date: string;
        comment: string;
    }): Observable<Array<IAssistanceIncident>> {
        return this.httpService.post<Array<IAssistanceIncident>>('/DayOffs/reject', form);
    }

    public syncIncapacity(form: {
        TypeNom: number;
        PeriodId: string;
        TenantId: string;
    }): Observable<ISyncIncapacityOutput> {
        return this.httpService.post<ISyncIncapacityOutput>('/DayOffs/sync-incapacity', form);
    }
}