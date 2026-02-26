export interface CreateRol {
    label: string;
    sections: Array<{ code: string, label: string}>;
    canClosePayrollPeriod: boolean;
    canModifyCheckins: boolean;
    canManagePeriods: boolean;
}