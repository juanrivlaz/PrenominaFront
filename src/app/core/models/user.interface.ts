export interface IUser {
    id: string;
    name: string;
    email: string;
    lastConnectionAt?: string | null;
}