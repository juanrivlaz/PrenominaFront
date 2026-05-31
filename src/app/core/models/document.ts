import { ModuleDocument } from "./module-document";

export enum DocumentModule {
    Generic = 0,
    Contracts = 1,
    Permits = 2,
    Notifications = 3,
}

export interface Document {
    id?: string;
    name: string;
    modules?: Array<ModuleDocument>;
    keyParams: Array<string>;
    path?: string;
    content?: string;
    module?: DocumentModule;
}

export interface IDocumentInput {
    name: string;
    path?: string | null;
    content?: string | null;
    module: DocumentModule;
    keyParams: Array<string>;
}