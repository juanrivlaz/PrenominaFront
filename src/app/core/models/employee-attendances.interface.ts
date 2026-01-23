import { IAttendance } from "./attendance.interface";
import { IEmployee } from "./employee.interface";

export interface IEmployeeAttendance extends IEmployee {
    activity: string;
    attendances?: Array<IAttendance>;
}