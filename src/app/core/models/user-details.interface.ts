import { Center } from "./center";
import { Company } from "./company";
import { Role } from "./role";
import { Supervisor } from "./supervisor";
import { IUserCompanies } from "./user-company.interface";

export interface UserDetails {
    companies: Array<Company>;
    userCompanies: Array<IUserCompanies>;
    centers: Array<Center> | null;
    supervisors: Array<Supervisor> | null;
    role: Role;
}