export interface IPeriod {
    typeNom: number;
    number: number;
    yearOfOperation: number;
    company: number;
    startDate?: Date;
    endDate?: Date;
    payDate?: Date;
    days?: number;
    month?: string;
    startDateAdmin?: Date;
    endDateAdmin?: Date;
}