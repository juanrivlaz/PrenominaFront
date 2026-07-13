/**
 * Estado de generación del archivo de tiempo extra de un periodo (indicador anti doble-pago).
 */
export interface IOvertimePaymentFileStatus {
    generated: boolean;
    generatedAt: string | null;
    lastGeneratedAt: string | null;
    generationCount: number;
    generatedByName: string | null;
    lineCount: number;
    totalAmount: number;
}
