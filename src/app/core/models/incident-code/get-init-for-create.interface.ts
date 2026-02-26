import { Role } from "../role";
import { IUser } from "../user.interface";

export interface IGetInitForCreate {
  users: Array<IUser>;
  roles: Array<Role>;
}