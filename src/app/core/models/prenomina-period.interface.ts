export interface IPrenominaPeriod {
    id: string;
    typePayroll: number;
    numPeriod: number;
    year: number;
    company: number;
    startDate: Date;
    closingDate: Date;
    datePayment: Date;
    totalDays: number;
    startAdminDate: Date;
    closingAdminDate: Date;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
    isActive: boolean;
}