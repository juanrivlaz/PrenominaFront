import { IAssistanceIncident } from "./assistance-incident.interface";

export interface IAttendance {
    date: string;
    incidentCode: string;
    label: string,
    day: string,
    typeNom?: number;
    checkEntry?: string | null;
    checkOut?: string | null;
    assistanceIncidents?: Array<IAssistanceIncident>;
    customValue?: string;
    isInconsistency?: boolean;
    isDayOff?: boolean;
}