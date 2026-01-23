import { IIncidentCode } from "@core/models/incident-code.interface";

export interface IAssignSpecialIncident {
    name: string;
    activity: string;
    codigo: number;
    dates: Array<{
        day: string,
        date: string,
        label: string
    }>;
    incidentCodes: Array<IIncidentCode>;
}