import { HttpClient, HttpResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { IInitAttendanceRecords } from "@core/models/init-attendance-records.interface";
import { IFilterReports } from "@core/models/reports/filter.interface";
import { Observable } from "rxjs";

@Injectable()
export class ReportsService {
    constructor(private readonly httpService: HttpClient) {}

    public getInit(): Observable<IInitAttendanceRecords> {
        return this.httpService.get<IInitAttendanceRecords>('/attendance/init');
    }
    
    public getDelays({ page = 1, pageSize = 30, payroll = 1, numPeriod = 1, search = '', filterDates }: IFilterReports): Observable<Array<any>> {
        return this.httpService.get<Array<any>>('/Reports/delays', {
            params: {
                'Paginator.Page': page,
                'Paginator.PageSize': pageSize,
                TypeNomina: payroll,
                NumPeriod: numPeriod,
                Search: search,
                ...(filterDates && {
                    'FilterDates.Start': filterDates.start.toISOString(),
                    'FilterDates.End': filterDates.end.toISOString(),
                }),
            }
        });
    }

    public getOvertimes({ page = 1, pageSize = 30, payroll = 1, numPeriod = 1, search = '', filterDates }: IFilterReports): Observable<Array<any>> {
        return this.httpService.get<Array<any>>('/Reports/overtimes', {
            params: {
                'Paginator.Page': page,
                'Paginator.PageSize': pageSize,
                TypeNomina: payroll,
                NumPeriod: numPeriod,
                Search: search,
                ...(filterDates && {
                    'FilterDates.Start': filterDates.start.toISOString(),
                    'FilterDates.End': filterDates.end.toISOString(),
                }),
            }
        });
    }

    public getHoursWorked({ page = 1, pageSize = 30, payroll = 1, numPeriod = 1, search = '', filterDates }: IFilterReports): Observable<Array<any>> {
        return this.httpService.get<Array<any>>('/Reports/hours-worked', {
            params: {
                'Paginator.Page': page,
                'Paginator.PageSize': pageSize,
                TypeNomina: payroll,
                NumPeriod: numPeriod,
                Search: search,
                ...(filterDates && {
                    'FilterDates.Start': filterDates.start.toISOString(),
                    'FilterDates.End': filterDates.end.toISOString(),
                }),
            }
        });
    }

    public getAttendance({ page = 1, pageSize = 30, payroll = 1, numPeriod = 1, search = '', filterDates }: IFilterReports): Observable<Array<any>> {
        return this.httpService.get<Array<any>>('/Reports/attendance', {
            params: {
                'Paginator.Page': page,
                'Paginator.PageSize': pageSize,
                TypeNomina: payroll,
                NumPeriod: numPeriod,
                Search: search,
                ...(filterDates && {
                    'FilterDates.Start': filterDates.start.toISOString(),
                    'FilterDates.End': filterDates.end.toISOString(),
                }),
            }
        });
    }

    public downloadExcelDelays({ page = 1, pageSize = 30, payroll = 1, numPeriod = 1, search = '', filterDates }: IFilterReports): Observable<HttpResponse<Blob>> {
        return this.httpService.get('/Reports/delays/download-excel', {
            observe: 'response',
            responseType: 'blob',
            params: {
                'Paginator.Page': page,
                'Paginator.PageSize': pageSize,
                TypeNomina: payroll,
                NumPeriod: numPeriod,
                Search: search,
                ...(filterDates && {
                    'FilterDates.Start': filterDates.start.toISOString(),
                    'FilterDates.End': filterDates.end.toISOString(),
                }),
            }
        });
    }

    public downloadExcelOvertimes({ page = 1, pageSize = 30, payroll = 1, numPeriod = 1, search = '', filterDates }: IFilterReports): Observable<HttpResponse<Blob>> {
        return this.httpService.get('/Reports/overtimes/download-excel', {
            observe: 'response',
            responseType: 'blob',
            params: {
                'Paginator.Page': page,
                'Paginator.PageSize': pageSize,
                TypeNomina: payroll,
                NumPeriod: numPeriod,
                Search: search,
                ...(filterDates && {
                    'FilterDates.Start': filterDates.start.toISOString(),
                    'FilterDates.End': filterDates.end.toISOString(),
                }),
            }
        });
    }

    public downloadExcelHoursWorked({ page = 1, pageSize = 30, payroll = 1, numPeriod = 1, search = '', filterDates }: IFilterReports): Observable<HttpResponse<Blob>> {
        return this.httpService.get('/Reports/hours-worked/download-excel', {
            observe: 'response',
            responseType: 'blob',
            params: {
                'Paginator.Page': page,
                'Paginator.PageSize': pageSize,
                TypeNomina: payroll,
                NumPeriod: numPeriod,
                Search: search,
                ...(filterDates && {
                    'FilterDates.Start': filterDates.start.toISOString(),
                    'FilterDates.End': filterDates.end.toISOString(),
                }),
            }
        });
    }

    public downloadExcelAttendance({ page = 1, pageSize = 30, payroll = 1, numPeriod = 1, search = '', filterDates }: IFilterReports): Observable<HttpResponse<Blob>> {
        return this.httpService.get('/Reports/attendance/download-excel', {
            observe: 'response',
            responseType: 'blob',
            params: {
                'Paginator.Page': page,
                'Paginator.PageSize': pageSize,
                TypeNomina: payroll,
                NumPeriod: numPeriod,
                Search: search,
                ...(filterDates && {
                    'FilterDates.Start': filterDates.start.toISOString(),
                    'FilterDates.End': filterDates.end.toISOString(),
                }),
            }
        });
    }

    public getHttpResponseFileName(response: HttpResponse<Blob>, defaultName: string): string {
        const contentDisposition = response.headers.get('Content-Disposition');
        if (contentDisposition) {
            const matches = /filename="?(?<filename>[^"]+);"?/.exec(contentDisposition);

            if (matches && matches.groups && matches.groups['filename']) {
                return matches.groups['filename'];
            }
        }

        return defaultName;
    }
}