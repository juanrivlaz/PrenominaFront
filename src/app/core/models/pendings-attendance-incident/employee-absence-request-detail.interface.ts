import { AbsenceRequestStatus } from '../enum/absence-request-status';

export interface IAbsenceRequestDayDetail {
  date: Date;
  overtimeMinutes: number;
  overtimeFormatted: string;
}

export type ApprovalStepStatus = 'Pending' | 'Approved' | 'Rejected' | 'Skipped' | 'Blocked';

export interface IAbsenceRequestApprovalStep {
  stepOrder: number;
  roleLabel: string;
  scope: string;
  status: ApprovalStepStatus;
  isCurrent: boolean;
  approvedByName?: string;
  approvedAt?: Date;
  comment?: string;
  daysPending?: number;
  isOverdue?: boolean;
  candidateNames?: Array<string>;
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
  approvalChain: Array<IAbsenceRequestApprovalStep>;
}
