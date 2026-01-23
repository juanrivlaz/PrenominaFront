import { Center } from "./center";
import { TypeTenant } from "./enum/type-tenant";
import { Supervisor } from "./supervisor";

export interface ITenantsForIgnoreIncident {
    typeTenant: TypeTenant;
    centers?: Array<Center>;
    supervisors?: Array<Supervisor>;
}