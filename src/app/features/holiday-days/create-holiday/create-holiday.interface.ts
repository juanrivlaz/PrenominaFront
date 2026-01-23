import { Holiday } from "@core/models/holiday";
import { IIncidentCode } from "@core/models/incident-code.interface";

export interface ICreateHoliday {
    holiday?: Holiday;
    incidentCodes: Array<IIncidentCode>;
}