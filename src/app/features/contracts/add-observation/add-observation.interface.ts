import { ContractsService } from "../contracts.service";

export interface IAddObservation {
    folioContract: number;
    employeeCode: number;
    companyId: number;
    service: ContractsService
    observation?: string;
    generateContract?: boolean;
    contractDays: number;
}