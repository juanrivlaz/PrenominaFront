import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { ISysConfigReports } from "@core/models/sys-config-reports.interface";
import { Observable } from "rxjs";

@Injectable()
export class SettingsService {
    constructor(private readonly httpService: HttpClient) {}

    public getConfigReports(): Observable<ISysConfigReports> {
        return this.httpService.get<ISysConfigReports>('/SystemConfig/config-reports');
    }

    public updateClockInterval(Minutes: number): Observable<boolean> {
        return this.httpService.put<boolean>('/SystemConfig/clock-interval', {
            Minutes,
        });
    }

    public updateTypeTenantMode(TypeTenant: number): Observable<boolean> {
        return this.httpService.put<boolean>('/SystemConfig/type-tenant', {
            TypeTenant,
        });
    }

    public updateTypeDayOffReport(TypeDayOffReport: number): Observable<boolean> {
        return this.httpService.put<boolean>('/SystemConfig/type-day-off-report', {
            TypeDayOffReport,
        });
    }

    public updateTypePrenominaPdfReport(TypePrenominaPdfReport: number): Observable<boolean> {
        return this.httpService.put<boolean>('/SystemConfig/type-prenomina-pdf-report', {
            TypePrenominaPdfReport,
        });
    }

    public updateMinToOvertimeReport(Minutes: number): Observable<boolean> {
        return this.httpService.put<boolean>('/SystemConfig/min-to-overtime-report', {
            Minutes,
        });
    }

    public updateYear(Year: number): Observable<boolean> {
        return this.httpService.put<boolean>('/SystemConfig/year', {
            Year,
        });
    }
}