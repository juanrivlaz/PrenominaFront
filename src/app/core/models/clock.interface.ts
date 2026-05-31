export interface IClock {
    id: string;
    ip: string;
    port: number;
    label: string;
    lastSyncAt: string | null;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
}