import { ISectionRol } from "./section-rol.interface";

export class Role {
    public id: string;
    public code: string;
    public label: string;
    public sections: Array<ISectionRol>;

    public constructor(id?: string, code?: string, label?: string, sections?: Array<ISectionRol>) {
        this.id = id || '';
        this.code = code || '';
        this.label = label || '';
        this.sections = sections || [];
    }
}