import { Center } from "@core/models/center";
import { Company } from "@core/models/company";
import { TypeTenant } from "@core/models/enum/type-tenant";
import { Role } from "@core/models/role";
import { Supervisor } from "@core/models/supervisor";
import { UsersService } from "../users.service";
import { IUserWithDetails } from "@core/models/user-with-details.interface";

export interface ICreateUser {
    companies: Array<Company>;
    roles: Array<Role>;
    centers: Array<Center>;
    supervisors: Array<Supervisor>;
    typeTenant: TypeTenant;
    service: UsersService;
    editData?: IUserWithDetails;
}