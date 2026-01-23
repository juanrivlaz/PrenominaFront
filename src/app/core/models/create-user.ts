export interface ICreateUser {
    password: string;
    name: string;
    email: string;
    roleId: string;
    companies: Array<{
        id: number,
        tenantIds: Array<number>
    }>;
}