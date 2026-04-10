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

    // BioTime Sync
    public getBioTimeSyncConfig(): Observable<{ syncHour: string; enabled: boolean }> {
        return this.httpService.get<{ syncHour: string; enabled: boolean }>('/BioTimeSync/config');
    }

    public saveBioTimeSyncConfig(config: { syncHour: string; enabled: boolean }): Observable<any> {
        return this.httpService.put('/BioTimeSync/config', config);
    }

    public saveBioTimeCredentials(credentials: { email: string; password: string; company: string }): Observable<any> {
        return this.httpService.put('/BioTimeSync/credentials', credentials);
    }

    public getBioTimeCredentialsStatus(): Observable<{ configured: boolean; email: string; company: string }> {
        return this.httpService.get<{ configured: boolean; email: string; company: string }>('/BioTimeSync/credentials/status');
    }

    public syncBioTimeNow(): Observable<any> {
        return this.httpService.post('/BioTimeSync/sync-now', {});
    }
}