export interface IStoreIncidentCode {
    code: string;
    externalCode: string;
    label: string;
    notes: string;
    requiredApproval: boolean;
    withOperation: boolean;
    isAdditional: boolean;
    applyMode: string;
    metadata: {
        amount: number;
        mathOperation: string;
        columnForOperation: string;
    },
    incidentApprovers: Array<string>;
}