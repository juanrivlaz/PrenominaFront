import { IEmployessDayOff } from "./employees-day-off.interface";

export interface ISyncIncapacityOutput {
    totalIncapacities: number;
    totalVacations: number;
    items: Array<IEmployessDayOff>;
}