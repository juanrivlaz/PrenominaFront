import { IIncidentCode } from "./incident-code.interface";
import { IPayroll } from "./payroll.interface";
import { IPeriodStatus } from "./period-status.interface";
import { IPrenominaPeriod } from "./prenomina-period.interface";

export interface IInitAttendanceRecords {
    periods: Array<IPrenominaPeriod>;
    payrolls: Array<IPayroll>;
    incidentCodes: Array<IIncidentCode>;
    periodStatus: Array<IPeriodStatus>;
}