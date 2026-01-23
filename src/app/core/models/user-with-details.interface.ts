import { UserDetails } from "./user-details.interface";
import { IUser } from "./user.interface";

export interface IUserWithDetails extends IUser, UserDetails {
    totalTenants: number;
}
