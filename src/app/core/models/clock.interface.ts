export interface IClock {
    id: string;
    ip: string;
    port: number;
    label: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
}