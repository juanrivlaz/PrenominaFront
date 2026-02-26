import { IIncidentCode } from "@core/models/incident-code.interface";
import { Role } from "@core/models/role";
import { IUser } from "@core/models/user.interface";

export interface IAddIncidentCode {
    name: string;
    incidentCode: string;
    listUsers: Array<IUser>;
    listRoles: Array<Role>;
    item?: IIncidentCode;
}