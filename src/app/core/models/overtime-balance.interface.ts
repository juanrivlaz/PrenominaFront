export interface IOvertimeBalance {
    employeeCode: number;
    fullName: string;
    department: string;
    jobPosition: string;
    /** Minutos disponibles para usar. */
    availableMinutes: number;
    /** Texto formateado (ej: "12 hrs 30 min"). */
    availableFormatted: string;
    totalAccumulatedMinutes: number;
    totalUsedMinutes: number;
    totalPaidMinutes: number;
    lastUpdated: string;
}
