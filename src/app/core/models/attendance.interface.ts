import { IAssistanceIncident } from "./assistance-incident.interface";

export interface IAttendance {
    date: string;
    incidentCode: string;
    label: string,
    day: string,
    typeNom?: number;
    checkEntryId?: string | null;
    checkEntry?: string | null;
    checkOutId?: string | null;
    checkOut?: string | null;
    assistanceIncidents?: Array<IAssistanceIncident>;
    customValue?: string;
    isInconsistency?: boolean;
    isDayOff?: boolean;
}