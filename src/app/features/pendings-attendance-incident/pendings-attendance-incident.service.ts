import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AbsenceRequestStatus } from '@core/models/enum/absence-request-status';
import { IEmployeeAbsenceRequests } from '@core/models/pendings-attendance-incident/employee-absence-requests.interface';
import { IEmployeeAbsenceRequestDetail } from '@core/models/pendings-attendance-incident/employee-absence-request-detail.interface';
import { IOvertimePaymentRequest, IOvertimePaymentRequestDetail } from '@core/models/pendings-attendance-incident/overtime-payment-request.interface';
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

  public reResolveChain(id: string): Observable<{ changed: number; message: string }> {
    return this.httpService.post<{ changed: number; message: string }>(`/EmployeeAbsenceRequests/${id}/reresolve`, {});
  }

  // ===== Papeletas de pago de horas extras =====
  public getOvertimePayments(): Observable<Array<IOvertimePaymentRequest>> {
    return this.httpService.get<Array<IOvertimePaymentRequest>>('/OvertimePaymentRequest');
  }

  public getOvertimePaymentDetail(id: string): Observable<IOvertimePaymentRequestDetail> {
    return this.httpService.get<IOvertimePaymentRequestDetail>(`/OvertimePaymentRequest/${id}/detail`);
  }

  public approveOvertimePayment(id: string, comment?: string): Observable<boolean> {
    return this.httpService.post<boolean>(`/OvertimePaymentRequest/${id}/approve`, { comment });
  }

  public rejectOvertimePayment(id: string, comment?: string): Observable<boolean> {
    return this.httpService.post<boolean>(`/OvertimePaymentRequest/${id}/reject`, { comment });
  }

  public reResolveOvertimePayment(id: string): Observable<{ changed: number }> {
    return this.httpService.post<{ changed: number }>(`/OvertimePaymentRequest/${id}/reresolve`, {});
  }

  public downloadOvertimePayment(id: string): Observable<HttpResponse<Blob>> {
    return this.httpService.get(`/OvertimePaymentRequest/${id}/download`, {
      responseType: 'blob',
      observe: 'response'
    });
  }

  public changeStatus(id: string, status: AbsenceRequestStatus, comment?: string): Observable<boolean> {
    return this.httpService.put<boolean>(`/EmployeeAbsenceRequests/${id}/status`, { status, comment });
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
