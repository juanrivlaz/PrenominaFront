import { IIncidentCode } from "@core/models/incident-code.interface";

export interface IAssignTimeOff {
    employeeCode: number;
    employeeName: string;
    dates: Array<Date>;
    incidentCodes: Array<IIncidentCode>;
    /** Minutos de horas extra acumuladas disponibles para el empleado. */
    availableOvertimeMinutes: number;
    /** Texto formateado del balance disponible (ej: "12 hrs 30 min"). */
    availableOvertimeFormatted: string;
}
