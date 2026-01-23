import { IPeriodStatus } from "@core/models/period-status.interface";

export interface IConfirmClosePeriod {
    periodName: string;
    tenantId: string;
    closedPeriod: boolean;
    listPeriodStatus: Array<IPeriodStatus>;
    TypePayroll: number,
    NumPeriod: number,
}