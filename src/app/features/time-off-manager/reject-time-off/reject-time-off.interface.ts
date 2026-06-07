export interface IRejectTimeOff {
    employeeCode: number;
    employeeName: string;
    date: string;
    incidentCode: string;
    groupDates: Array<string>;
    // 'reject' (permiso ya aprobado, requiere motivo) | 'delete' (permiso pendiente, sólo confirmación).
    mode: 'reject' | 'delete';
}

export interface IRejectTimeOffOutput {
    comment: string;
}
