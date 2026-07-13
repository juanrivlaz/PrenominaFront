export interface IPeriodStatus {
    id: string;
    typePayroll: number;
    numPeriod: number;
    year: number;
    companyId: number;
    tenantId: string;
    // false = cierre; true = excepción de apertura para el tenant (override sobre '-999').
    isOpen: boolean;
}