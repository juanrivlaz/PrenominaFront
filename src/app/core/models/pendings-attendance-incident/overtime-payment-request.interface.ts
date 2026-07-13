import { AbsenceRequestStatus } from '../enum/absence-request-status';
import { IAbsenceRequestApprovalStep } from './employee-absence-request-detail.interface';

export interface IOvertimePaymentRequest {
  id: string;
  employeeName: string;
  employeeCode: number;
  totalMinutes: number;
  totalMinutesFormatted: string;
  status: AbsenceRequestStatus;
  createdAt: Date;
  notes?: string;
  requiresApproval: boolean;
  totalApprovers: number;
  approvedCount: number;
  alreadyApprovedByMe: boolean;
  canApprove: boolean;
}

export interface IOvertimePaymentRequestDetail {
  id: string;
  employeeName: string;
  employeeCode: number;
  totalMinutes: number;
  totalMinutesFormatted: string;
  status: AbsenceRequestStatus;
  createdAt: Date;
  notes?: string;
  /** Fechas origen de las horas extras que cubre la papeleta. */
  overtimeDates: Array<string>;
  approvalChain: Array<IAbsenceRequestApprovalStep>;
}
