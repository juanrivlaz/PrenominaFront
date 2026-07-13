/**
 * Renglón del archivo de importación de tiempo extra (NóminaTISS-SAR).
 * Estructura: CODIGO | CONCEPTO | IMPORTE | FECHA(dd/mm/aaaa) | HORAS
 */
export interface IOvertimePaymentLine {
    employeeCode: number;
    fullName: string;
    jobPosition: string;
    concept: number;
    amount: number;
    date: string;
    hours: number;
}
