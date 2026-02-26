import { AttendaceService } from "../attendace.service";

export interface IChangeAttendance {
  employeeId: number;
  employeeName: string;
  employeeCode: string;
  employeeActivity: string;
  date: string;
  day: string;
  label: string;
  service: AttendaceService,
  checkEntryId?: string | null;
  checkEntry?: string | null;
  checkOutId?: string | null;
  checkOut?: string | null;
}