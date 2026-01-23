import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { IAssistanceIncident } from "@core/models/assistance-incident.interface";
import { IChangePeriodStatus } from "@core/models/change-period-status.interface";
import { IDayOffs } from "@core/models/day-offs.interface";
import { IEmployeeAttendance } from "@core/models/employee-attendances.interface";
import { TypeFileDownload } from "@core/models/enum/type-file-download";
import { IInitAttendanceRecords } from "@core/models/init-attendance-records.interface";
import { IPagedResult } from "@core/models/paged-result.interface";
import { IPeriodStatus } from "@core/models/period-status.interface";
import { Observable } from "rxjs";

@Injectable({
    providedIn: 'root'
})
export class AttendaceService {
    constructor(private readonly httpService: HttpClient) {}

    public insertAttendaceIncident(incidentCode: string, date: string, employeeCode: number): Observable<IAssistanceIncident> {
        return this.httpService.patch<IAssistanceIncident>('/Attendance/apply-incident', {
            incidentCode,
            date,
            employeeCode
        });
    }

    public getInit(): Observable<IInitAttendanceRecords> {
        return this.httpService.get<IInitAttendanceRecords>('/attendance/init');
    }

    public get(page: number = 1, pageSize: number = 30, payroll: number = 1, numPeriod: number = 1, search: string = ''): Observable<IPagedResult<IEmployeeAttendance>> {
        return this.httpService.get<IPagedResult<IEmployeeAttendance>>('/attendance', {
            params: {
                'Paginator.Page': page,
                'Paginator.PageSize': pageSize,
                TypeNomina: payroll,
                NumPeriod: numPeriod,
                Search: search,
            }
        });
    }

    public downloadReport(payrollId: number, numberPeriod: number, typeFileDownload: TypeFileDownload): Observable<Blob> {
        return this.httpService.get('/Attendance/download', {
            responseType: 'blob',
            params: {
                'Paginator.Page': 1,
                'Paginator.PageSize': 30,
                TypeNomina: payrollId,
                NumPeriod: numberPeriod,
                typeFileDownload
            }
        });
    }

    public deleteIncidents(incidentIds: Array<string>): Observable<boolean> {
        return this.httpService.delete<boolean>('/Attendance/delete-incidents', {
            body: {
                incidentIds,
            },
        });
    }

    public assignDoubleShift(date: string, employeeCode: number): Observable<IAssistanceIncident> {
        return this.httpService.post<IAssistanceIncident>('/Attendance/assign-double-shift', {
            date,
            employeeCode
        });
    }

    public getDayOffs(): Observable<Array<IDayOffs>> {
        return this.httpService.get<Array<IDayOffs>>('/DayOffs');
    }

    public changePeridStatus(form: IChangePeriodStatus): Observable<Array<IPeriodStatus>> {
        return this.httpService.post<Array<IPeriodStatus>>('/Period/change-status', form);
    }
}