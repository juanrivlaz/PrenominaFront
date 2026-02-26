import { ApplyMode } from "./enum/apply-mode";
import { IIncidentApprover } from "./incident-approver.interface";
import { IIncidentCodeMetadata } from "./incident-code-metadata.interface";
import { IIncidentCodeAllowedRoles } from "./incident-code/incident-code-allowed-roles.interface";

export interface IIncidentCode {
    code: string;
    externalCode: string;
    label: string;
    notes?: string;
    requiredApproval: boolean;
    withOperation: boolean;
    isAdditional: boolean;
    restrictedWithRoles: boolean;
    applyMode: ApplyMode;
    incidentApprovers: Array<IIncidentApprover>;
    incidentCodeMetadata?: IIncidentCodeMetadata;
    incidentCodeAllowedRoles?: Array<IIncidentCodeAllowedRoles>;
}