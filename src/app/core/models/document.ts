import { ModuleDocument } from "./module-document";

export interface Document {
    name: string;
    modules: Array<ModuleDocument>;
    params: Array<string>;
    path: string;
}