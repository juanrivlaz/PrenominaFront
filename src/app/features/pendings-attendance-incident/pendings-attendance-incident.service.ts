import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AbsenceRequestStatus } from '@core/models/enum/absence-request-status';
import { IEmployeeAbsenceRequests } from '@core/models/pendings-attendance-incident/employee-absence-requests.interface';
import { IEmployeeAbsenceRequestDetail } from '@core/models/pendings-attendance-incident/employee-absence-request-detail.interface';
import { IPendingIncidenceApproval } from '@core/models/pendings-attendance-incident/pending-incidence-approval.interface';
import { Observable } from 'rxjs';

@Injectable()
export class PendingsAttendanceIncidentService {
  constructor(private readonly httpService: HttpClient) {}

  public get(): Observable<Array<IEmployeeAbsenceRequests>> {
    return this.httpService.get<Array<IEmployeeAbsenceRequests>>('/EmployeeAbsenceRequests');
  }

  public getDetail(id: string): Observable<IEmployeeAbsenceRequestDetail> {
    return this.httpService.get<IEmployeeAbsenceRequestDetail>(`/EmployeeAbsenceRequests/${id}/detail`);
  }

  public changeStatus(id: string, status: AbsenceRequestStatus): Observable<boolean> {
    return this.httpService.put<boolean>(`/EmployeeAbsenceRequests/${id}/status`, { status });
  }

  public download(id: string): Observable<HttpResponse<Blob>> {
    return this.httpService.get(`/EmployeeAbsenceRequests/${id}/download`, {
      responseType: 'blob',
      observe: 'response'
    });
  }

  // ===== Incidences to approve (assigned via "Asig. Incidencia" with approvers) =====

  public getPendingIncidences(status: AbsenceRequestStatus | -1 = AbsenceRequestStatus.Pending): Observable<Array<IPendingIncidenceApproval>> {
    return this.httpService.get<Array<IPendingIncidenceApproval>>('/Attendance/pending-incidence-approvals', {
      params: { status }
    });
  }

  public approveIncidence(assistanceIncidentId: string): Observable<unknown> {
    return this.httpService.post('/Attendance/approve-incidence', { assistanceIncidentId });
  }

  public rejectIncidence(assistanceIncidentId: string, comment?: string): Observable<unknown> {
    return this.httpService.post('/Attendance/reject-incidence', { assistanceIncidentId, comment });
  }

  public approveIncidenceGroup(requestGroupId: string): Observable<unknown> {
    return this.httpService.post('/Attendance/approve-incidence-group', { requestGroupId });
  }

  public rejectIncidenceGroup(requestGroupId: string, comment?: string): Observable<unknown> {
    return this.httpService.post('/Attendance/reject-incidence-group', { requestGroupId, comment });
  }
}
