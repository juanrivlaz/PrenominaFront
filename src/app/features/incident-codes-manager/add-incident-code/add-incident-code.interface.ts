import { IIncidentCode } from "@core/models/incident-code.interface";
import { IUser } from "@core/models/user.interface";

export interface IAddIncidentCode {
    name: string;
    incidentCode: string;
    listUsers: Array<IUser>;
    item?: IIncidentCode;
}