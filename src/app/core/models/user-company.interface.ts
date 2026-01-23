import { IUserDepartment } from "./user-department.interface";
import { IUserSupervisor } from "./user-supervisor.interfce";

export interface IUserCompanies {
    id: string;
    userId: string;
    companyId: number;
    userDepartments?: Array<IUserDepartment>;
    userSupervisors?: Array<IUserSupervisor>;
}