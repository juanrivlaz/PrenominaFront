import { ApplyMode } from "./enum/apply-mode";
import { IIncidentApprover } from "./incident-approver.interface";
import { IIncidentCodeMetadata } from "./incident-code-metadata.interface";

export interface IIncidentCode {
    code: string;
    externalCode: string;
    label: string;
    notes?: string;
    requiredApproval: boolean;
    withOperation: boolean;
    isAdditional: boolean;
    applyMode: ApplyMode;
    incidentApprovers: Array<IIncidentApprover>;
    incidentCodeMetadata?: IIncidentCodeMetadata;
}