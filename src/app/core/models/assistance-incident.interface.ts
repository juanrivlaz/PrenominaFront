import { IIncidentCode } from "./incident-code.interface";

export interface IAssistanceIncident {
    id: string;
    date: Date;
    incidentCode: string;
    timeOffRequest: boolean;
    approved: boolean;
    label?: string;
    isAdditional: boolean;
    updatedAt: Date;
    itemIncidentCode: IIncidentCode
}