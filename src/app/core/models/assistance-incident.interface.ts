import { IIncidentCode } from "./incident-code.interface";

export interface IAssistanceIncident {
    id: string;
    date: Date;
    incidentCode: string;
    timeOffRequest: boolean;
    approved: boolean;
    rejected: boolean;
    rejectionComment?: string;
    rejectedAt?: Date;
    requestGroupId?: string;
    label?: string;
    isAdditional: boolean;
    updatedAt: Date;
    itemIncidentCode: IIncidentCode
}