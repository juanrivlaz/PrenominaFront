import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { IEmployee } from "@core/models/employee.interface";
import { IIgnoreIncidentToActivity } from "@core/models/ignore-incident-to-activity.interface";
import { IIgnoreIncidentToEmployee } from "@core/models/ignore-incident-to-employee.interface";
import { IIgnoreIncidentToTenant } from "@core/models/ignore-incident-to-tenant.interface";
import { IIncidentCode } from "@core/models/incident-code.interface";
import { IPagedResult } from "@core/models/paged-result.interface";
import { ITabulator } from "@core/models/tabulator.interface";
import { ITenantsForIgnoreIncident } from "@core/models/tenants-for-ignore-incident.interface";
import { Observable } from "rxjs";

@Injectable()
export class EmployeeAdjustmentsService {
    constructor(private readonly httpService: HttpClient) {}

    public getTenants(): Observable<ITenantsForIgnoreIncident> {
        return this.httpService.get<ITenantsForIgnoreIncident>('/IgnoreIncidentToTenant/get-tenants');
    }

    public getEmployee(): Observable<IPagedResult<IEmployee>> {
        return this.httpService.get<IPagedResult<IEmployee>>('/Employees/by-payroll', {
            params: {
                Page: 0,
                PageSize: 0,
                NoPagination: true,
                TypeNom: -1
            }
        });
    }

    public getActivities(): Observable<Array<ITabulator>> {
        return this.httpService.get<Array<ITabulator>>('/IgnoreIncidentToActivity/activities');
    }

    public getIncidentCodes(): Observable<Array<IIncidentCode>> {
        return this.httpService.get<Array<IIncidentCode>>('/IncidentCode');
    }

    public getIgnoreIncidentEmployee(employeeCode: number): Observable<Array<IIgnoreIncidentToEmployee>> {
        return this.httpService.get<Array<IIgnoreIncidentToEmployee>>(`/IgnoreIncidentToEmployee/${employeeCode}`);
    }

    public getIgnoreIncidentTenant(tenantId: string): Observable<Array<IIgnoreIncidentToTenant>> {
        return this.httpService.get<Array<IIgnoreIncidentToTenant>>(`/IgnoreIncidentToTenant/${tenantId}`);
    }

    public getIgnoreIncidentActivity(activityId: number): Observable<Array<IIgnoreIncidentToActivity>> {
        return this.httpService.get<Array<IIgnoreIncidentToActivity>>(`/IgnoreIncidentToActivity/${activityId}`);
    }

    public addIgnoreIncidentToEmployee(employeeCode: number, incidentCodes: Array<{
        code: string;
        ignore: boolean;
    }>): Observable<boolean> {
        return this.httpService.post<boolean>('/IgnoreIncidentToEmployee', {
            employeeCode,
            incidentCodes,
        });
    }

    public addIgnoreIncidentToTenant(tenantId: string, incidentCodes: Array<{
        code: string;
        ignore: boolean;
    }>): Observable<boolean> {
        return this.httpService.post<boolean>('/IgnoreIncidentToTenant', {
            tenantId,
            incidentCodes
        });
    }

    public addIgnoreIncidentToActivity(activityId: number, incidentCodes: Array<{
        code: string;
        ignore: boolean;
    }>): Observable<boolean> {
        return this.httpService.post<boolean>('/IgnoreIncidentToActivity', {
            activityId,
            incidentCodes
        });
    }
}