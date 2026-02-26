export interface IChangeAttendance {
  employeeCode: number;
  date: string;
  checkEntryId?: string | null;
  checkEntry: string | null;
  checkOutId?: string | null;
  checkOut: string | null;
}