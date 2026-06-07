import { AbsenceRequestStatus } from '../enum/absence-request-status';

export interface IAbsenceRequestDayDetail {
  date: Date;
  overtimeMinutes: number;
  overtimeFormatted: string;
}

export interface IEmployeeAbsenceRequestDetail {
  id: string;
  employeeName: string;
  employeeCode: number;
  employeeActivity: string;
  incidentCode: string;
  incidentDescription: string;
  startDate: Date;
  endDate: Date;
  notes?: string;
  status: AbsenceRequestStatus;
  createdAt: Date;
  requiresApproval: boolean;
  totalApprovers: number;
  approvedCount: number;
  daysCount: number;
  usedOvertime: boolean;
  totalOvertimeMinutes: number;
  totalOvertimeFormatted: string;
  days: Array<IAbsenceRequestDayDetail>;
}
