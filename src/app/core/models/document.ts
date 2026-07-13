import { ModuleDocument } from "./module-document";

export enum DocumentModule {
    Generic = 0,
    Contracts = 1,
    Permits = 2,
    Notifications = 3,
    OvertimePayment = 4,
}

export interface IDocumentApprovalStep {
    stepOrder: number;
    roleId: string;
    scope: number;
    mode: number;
    isOptional: boolean;
}

export interface Document {
    id?: string;
    name: string;
    modules?: Array<ModuleDocument>;
    keyParams: Array<string>;
    path?: string;
    content?: string;
    module?: DocumentModule;
    approvalSteps?: Array<IDocumentApprovalStep>;
    signers?: Array<string>;
}

export interface IDocumentInput {
    name: string;
    path?: string | null;
    content?: string | null;
    module: DocumentModule;
    keyParams: Array<string>;
    approvalSteps?: Array<IDocumentApprovalStep>;
}