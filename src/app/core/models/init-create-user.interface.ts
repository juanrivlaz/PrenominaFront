import { Center } from "./center";
import { Company } from "./company";
import { Role } from "./role";
import { Supervisor } from "./supervisor";

export interface IInitCreateUser {
    companies: Array<Company>;
    roles: Array<Role>;
    centers?: Array<Center>;
    supervisors?: Array<Supervisor>;
}