import { AbsenceRequestStatus } from '../enum/absence-request-status';

export interface IEmployeeAbsenceRequests {
  id: string;
  employeeName: string;
  employeeCode: number;
  employeeActivity: string;
  incidentCode: string;
  incidentDescription: string;
  startDate: Date;
  endDate: Date;
  status: AbsenceRequestStatus;
  statusLabel: string;
  createdAt: Date;
  notes?: string;
  sortNote?: string;
}
