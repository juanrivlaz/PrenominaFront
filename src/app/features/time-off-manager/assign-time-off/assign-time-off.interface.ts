import { IIncidentCode } from "@core/models/incident-code.interface";

export interface IAssignTimeOff {
    employeeCode: number;
    employeeName: string;
    dates: Array<Date>;
    incidentCodes: Array<IIncidentCode>
}