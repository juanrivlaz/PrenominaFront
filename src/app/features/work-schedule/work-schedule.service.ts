import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import {
    IWorkSchedule,
    IWorkScheduleInput,
    IEmployeeScheduleAssignment,
    IActivityScheduleConfig
} from "@core/models/work-schedule.interface";
import { Observable } from "rxjs";

@Injectable()
export class WorkScheduleService {
    constructor(private readonly httpService: HttpClient) {}

    public list(): Observable<Array<IWorkSchedule>> {
        return this.httpService.get<Array<IWorkSchedule>>('/WorkSchedule');
    }

    public getById(id: string): Observable<IWorkSchedule> {
        return this.httpService.get<IWorkSchedule>(`/WorkSchedule/${id}`);
    }

    public create(form: IWorkScheduleInput): Observable<IWorkSchedule> {
        return this.httpService.post<IWorkSchedule>('/WorkSchedule', form);
    }

    public update(id: string, form: IWorkScheduleInput): Observable<boolean> {
        return this.httpService.put<boolean>(`/WorkSchedule/${id}`, form);
    }

    public delete(id: string): Observable<boolean> {
        return this.httpService.delete<boolean>(`/WorkSchedule/${id}`);
    }

    public getAssignedEmployees(scheduleId: string): Observable<Array<number>> {
        return this.httpService.get<Array<number>>(`/WorkSchedule/${scheduleId}/employees`);
    }

    public assignBatch(employeeCodes: Array<number>, workScheduleId: string, effectiveFrom: string): Observable<boolean> {
        return this.httpService.post<boolean>('/WorkSchedule/assign', {
            employeeCodes,
            workScheduleId,
            effectiveFrom
        });
    }

    public getActiveAssignments(): Observable<Record<number, IEmployeeScheduleAssignment>> {
        return this.httpService.get<Record<number, IEmployeeScheduleAssignment>>('/WorkSchedule/active-assignments');
    }

    public getActivityConfigs(): Observable<Record<number, IActivityScheduleConfig>> {
        return this.httpService.get<Record<number, IActivityScheduleConfig>>('/WorkSchedule/activity-configs');
    }

    public assignActivitySchedule(activityId: number, workScheduleId: string | null): Observable<boolean> {
        return this.httpService.put<boolean>(`/Activities/${activityId}/work-schedule`, {
            workScheduleId
        });
    }

    public assignEmployeeSchedule(employeeCode: number, workScheduleId: string | null, effectiveFrom?: string): Observable<boolean> {
        return this.httpService.put<boolean>(`/Employees/${employeeCode}/work-schedule`, {
            workScheduleId,
            effectiveFrom
        });
    }

    public getEmployeeScheduleHistory(employeeCode: number): Observable<Array<IEmployeeScheduleAssignment>> {
        return this.httpService.get<Array<IEmployeeScheduleAssignment>>(`/Employees/${employeeCode}/work-schedule/history`);
    }
}
