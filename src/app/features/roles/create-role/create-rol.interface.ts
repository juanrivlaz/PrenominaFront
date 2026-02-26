import { ISectionRol } from "@core/models/section-rol.interface";

export interface ICreateRole {
  id?: string;
  code: string;
  label: string;
  sections: Array<ISectionRol>;
}