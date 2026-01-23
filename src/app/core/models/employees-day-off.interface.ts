import { IAssistanceIncident } from "./assistance-incident.interface";
import { IEmployee } from "./employee.interface";

export interface IEmployessDayOff extends IEmployee {
    attendancesIncident: Array<IAssistanceIncident>;
}