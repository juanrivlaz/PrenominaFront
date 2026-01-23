export interface IClockUser {
    id: string;
    enrollNumber: string;
    name: string;
    privilege: number;
    password: string;
    enabled: boolean;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}