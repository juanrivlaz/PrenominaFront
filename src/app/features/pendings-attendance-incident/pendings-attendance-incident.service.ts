import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AbsenceRequestStatus } from '@core/models/enum/absence-request-status';
import { IEmployeeAbsenceRequests } from '@core/models/pendings-attendance-incident/employee-absence-requests.interface';
import { Observable } from 'rxjs';

@Injectable()
export class PendingsAttendanceIncidentService {
  constructor(private readonly httpService: HttpClient) {}

  public get(): Observable<Array<IEmployeeAbsenceRequests>> {
    return this.httpService.get<Array<IEmployeeAbsenceRequests>>('/EmployeeAbsenceRequests');
  }

  public changeStatus(id: string, status: AbsenceRequestStatus): Observable<boolean> {
    return this.httpService.put<boolean>(`/EmployeeAbsenceRequests/${id}/status`, { status });
  }

  public download(id: string): Observable<Blob> {
    return this.httpService.get(`/EmployeeAbsenceRequests/${id}/download`, { responseType: 'blob' });
  }
}
