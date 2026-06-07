export interface IOvertimeUsage {
    /** Fecha del día del permiso en formato YYYY-MM-DD. */
    date: string;
    /** Minutos de horas acumuladas a utilizar ese día. */
    minutes: number;
}

export interface IAssignTimeOffOutput {
    incidentCode: string;
    requireAbsenceRequest: boolean;
    notes: string;
    /** Horas extra acumuladas a consumir por día (sólo días con minutos > 0). */
    overtimeUsages: Array<IOvertimeUsage>;
}
