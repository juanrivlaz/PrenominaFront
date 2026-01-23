export interface IFilterReports {
    page: number;
    pageSize: number;
    search: string;
    payroll?: number;
    numPeriod?: number;
    filterDates?: {
        start: Date;
        end: Date;
    };
}