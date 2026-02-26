import { IConfigDayOffReport } from "./config-day-off-report.interface";
import { IConfigAttendanceReport } from "./reports/config-attendance-report.interface";
import { IConfigOvertimeReport } from "./reports/config-overtime-report.interface";

export interface ISysConfigReports {
    configDayOffReport: IConfigDayOffReport;
    configOvertimeReport: IConfigOvertimeReport;
    configAttendanceReport?: IConfigAttendanceReport;
}