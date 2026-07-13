import { IIncidentCode } from "./incident-code.interface";

export interface IAssistanceIncident {
    id: string;
    date: Date;
    incidentCode: string;
    timeOffRequest: boolean;
    // Indica que la incidencia proviene de un flujo de aprobación (solicitud de ausencia o
    // incidencia que requiere aprobación); no se puede editar ni eliminar desde asistencia.
    fromApprovalFlow: boolean;
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