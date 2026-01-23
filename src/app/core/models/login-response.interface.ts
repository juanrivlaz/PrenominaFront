import { TypeTenant } from "./enum/type-tenant";
import { UserDetails } from "./user-details.interface";

export interface ILoginResponse {
    token: string;
    username: string;
    userDetails: UserDetails;
    typeTenant: TypeTenant;
}