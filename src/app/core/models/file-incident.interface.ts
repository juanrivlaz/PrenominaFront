import { IColumnFileIncident } from "./column-file-incident.interface";

export interface IFileIncident {
    id: string;
    name: string;
    columns: Array<IColumnFileIncident>;
}