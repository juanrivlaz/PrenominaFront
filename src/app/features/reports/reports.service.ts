import { HttpClient, HttpResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { IInitAttendanceRecords } from "@core/models/init-attendance-records.interface";
import { IFilterReports } from "@core/models/reports/filter.interface";
import {
    IOvertimeSummary,
    IOvertimeAccumulation,
    IOvertimeMovementsPaged,
    IOvertimeOperationResult,
    IAccumulateOvertimeInput,
    IPayOvertimeDirectInput,
    IUseOvertimeForRestDayInput,
    IProcessOvertimesBatchInput,
    ICancelOvertimeMovementInput,
    ISendToHourBankInput,
    IManualOvertimeEntryInput,
    OvertimeMovementType
} from "@core/models/reports/overtime-accumulation.interface";
import { IOvertimePaymentLine } from "@core/models/reports/overtime-payment-line.interface";
import { IOvertimePaymentFileStatus } from "@core/models/reports/overtime-payment-file-status.interface";
import { Observable } from "rxjs";

@Injectable()
export class ReportsService {
    constructor(private readonly httpService: HttpClient) {}

    public getInit(): Observable<IInitAttendanceRecords> {
        return this.httpService.get<IInitAttendanceRecords>('/attendance/init');
    }
    
    public getDelays({ page = 1, pageSize = 30, payroll = 1, numPeriod = 1, search = '', filterDates }: IFilterReports): Observable<Array<any>> {
        return this.httpService.get<Array<any>>('/Reports/delays', {
            params: {
                'Paginator.Page': page,
                'Paginator.PageSize': pageSize,
                TypeNomina: payroll,
                NumPeriod: numPeriod,
                Search: search,
                ...(filterDates && {
                    'FilterDates.Start': filterDates.start.toISOString(),
                    'FilterDates.End': filterDates.end.toISOString(),
                }),
            }
        });
    }

    public getOvertimes({ page = 1, pageSize = 30, payroll = 1, numPeriod = 1, search = '', filterDates }: IFilterReports): Observable<Array<any>> {
        return this.httpService.get<Array<any>>('/Reports/overtimes', {
            params: {
                'Paginator.Page': page,
                'Paginator.PageSize': pageSize,
                TypeNomina: payroll,
                NumPeriod: numPeriod,
                Search: search,
                ...(filterDates && {
                    'FilterDates.Start': filterDates.start.toISOString(),
                    'FilterDates.End': filterDates.end.toISOString(),
                }),
            }
        });
    }

    public getHoursWorked({ page = 1, pageSize = 30, payroll = 1, numPeriod = 1, search = '', filterDates }: IFilterReports): Observable<Array<any>> {
        return this.httpService.get<Array<any>>('/Reports/hours-worked', {
            params: {
                'Paginator.Page': page,
                'Paginator.PageSize': pageSize,
                TypeNomina: payroll,
                NumPeriod: numPeriod,
                Search: search,
                ...(filterDates && {
                    'FilterDates.Start': filterDates.start.toISOString(),
                    'FilterDates.End': filterDates.end.toISOString(),
                }),
            }
        });
    }

    public getAttendance({ page = 1, pageSize = 30, payroll = 1, numPeriod = 1, search = '', filterDates }: IFilterReports): Observable<Array<any>> {
        return this.httpService.get<Array<any>>('/Reports/attendance', {
            params: {
                'Paginator.Page': page,
                'Paginator.PageSize': pageSize,
                TypeNomina: payroll,
                NumPeriod: numPeriod,
                Search: search,
                ...(filterDates && {
                    'FilterDates.Start': filterDates.start.toISOString(),
                    'FilterDates.End': filterDates.end.toISOString(),
                }),
            }
        });
    }

    public getIncidences({ page = 1, pageSize = 30, payroll = 1, numPeriod = 1, search = '', filterDates }: IFilterReports): Observable<Array<any>> {
        return this.httpService.get<Array<any>>('/Reports/incidences', {
            params: {
                'Paginator.Page': page,
                'Paginator.PageSize': pageSize,
                TypeNomina: payroll,
                NumPeriod: numPeriod,
                Search: search,
                ...(filterDates && {
                    'FilterDates.Start': filterDates.start.toISOString(),
                    'FilterDates.End': filterDates.end.toISOString(),
                }),
            }
        });
    }

    public getAbandonment({ page = 1, pageSize = 30, payroll = 1, numPeriod = 1, search = '', filterDates }: IFilterReports): Observable<Array<any>> {
        return this.httpService.get<Array<any>>('/Reports/abandonment', {
            params: {
                'Paginator.Page': page,
                'Paginator.PageSize': pageSize,
                TypeNomina: payroll,
                NumPeriod: numPeriod,
                Search: search,
                ...(filterDates && {
                    'FilterDates.Start': filterDates.start.toISOString(),
                    'FilterDates.End': filterDates.end.toISOString(),
                }),
            }
        });
    }

    public downloadExcelAbandonment({ page = 1, pageSize = 30, payroll = 1, numPeriod = 1, search = '', filterDates }: IFilterReports): Observable<HttpResponse<Blob>> {
        return this.httpService.get('/Reports/abandonment/download-excel', {
            observe: 'response',
            responseType: 'blob',
            params: {
                'Paginator.Page': page,
                'Paginator.PageSize': pageSize,
                TypeNomina: payroll,
                NumPeriod: numPeriod,
                Search: search,
                ...(filterDates && {
                    'FilterDates.Start': filterDates.start.toISOString(),
                    'FilterDates.End': filterDates.end.toISOString(),
                }),
            }
        });
    }

    public downloadExcelDelays({ page = 1, pageSize = 30, payroll = 1, numPeriod = 1, search = '', filterDates }: IFilterReports): Observable<HttpResponse<Blob>> {
        return this.httpService.get('/Reports/delays/download-excel', {
            observe: 'response',
            responseType: 'blob',
            params: {
                'Paginator.Page': page,
                'Paginator.PageSize': pageSize,
                TypeNomina: payroll,
                NumPeriod: numPeriod,
                Search: search,
                ...(filterDates && {
                    'FilterDates.Start': filterDates.start.toISOString(),
                    'FilterDates.End': filterDates.end.toISOString(),
                }),
            }
        });
    }

    public downloadExcelOvertimes({ page = 1, pageSize = 30, payroll = 1, numPeriod = 1, search = '', filterDates }: IFilterReports): Observable<HttpResponse<Blob>> {
        return this.httpService.get('/Reports/overtimes/download-excel', {
            observe: 'response',
            responseType: 'blob',
            params: {
                'Paginator.Page': page,
                'Paginator.PageSize': pageSize,
                TypeNomina: payroll,
                NumPeriod: numPeriod,
                Search: search,
                ...(filterDates && {
                    'FilterDates.Start': filterDates.start.toISOString(),
                    'FilterDates.End': filterDates.end.toISOString(),
                }),
            }
        });
    }

    public downloadExcelHoursWorked({ page = 1, pageSize = 30, payroll = 1, numPeriod = 1, search = '', filterDates }: IFilterReports): Observable<HttpResponse<Blob>> {
        return this.httpService.get('/Reports/hours-worked/download-excel', {
            observe: 'response',
            responseType: 'blob',
            params: {
                'Paginator.Page': page,
                'Paginator.PageSize': pageSize,
                TypeNomina: payroll,
                NumPeriod: numPeriod,
                Search: search,
                ...(filterDates && {
                    'FilterDates.Start': filterDates.start.toISOString(),
                    'FilterDates.End': filterDates.end.toISOString(),
                }),
            }
        });
    }

    public downloadExcelAttendance({ page = 1, pageSize = 30, payroll = 1, numPeriod = 1, search = '', filterDates }: IFilterReports): Observable<HttpResponse<Blob>> {
        return this.httpService.get('/Reports/attendance/download-excel', {
            observe: 'response',
            responseType: 'blob',
            params: {
                'Paginator.Page': page,
                'Paginator.PageSize': pageSize,
                TypeNomina: payroll,
                NumPeriod: numPeriod,
                Search: search,
                ...(filterDates && {
                    'FilterDates.Start': filterDates.start.toISOString(),
                    'FilterDates.End': filterDates.end.toISOString(),
                }),
            }
        });
    }

    public downloadExcelIncidences({ page = 1, pageSize = 30, payroll = 1, numPeriod = 1, search = '', filterDates }: IFilterReports): Observable<HttpResponse<Blob>> {
        return this.httpService.get('/Reports/incidences/download-excel', {
            observe: 'response',
            responseType: 'blob',
            params: {
                'Paginator.Page': page,
                'Paginator.PageSize': pageSize,
                TypeNomina: payroll,
                NumPeriod: numPeriod,
                Search: search,
                ...(filterDates && {
                    'FilterDates.Start': filterDates.start.toISOString(),
                    'FilterDates.End': filterDates.end.toISOString(),
                }),
            }
        });
    }

    public downloadPdfAbandonment({ page = 1, pageSize = 30, payroll = 1, numPeriod = 1, search = '', filterDates }: IFilterReports): Observable<HttpResponse<Blob>> {
        return this.downloadPdf('/Reports/abandonment/download-pdf', { page, pageSize, payroll, numPeriod, search, filterDates });
    }

    public downloadPdfDelays({ page = 1, pageSize = 30, payroll = 1, numPeriod = 1, search = '', filterDates }: IFilterReports): Observable<HttpResponse<Blob>> {
        return this.downloadPdf('/Reports/delays/download-pdf', { page, pageSize, payroll, numPeriod, search, filterDates });
    }

    public downloadPdfOvertimes({ page = 1, pageSize = 30, payroll = 1, numPeriod = 1, search = '', filterDates }: IFilterReports): Observable<HttpResponse<Blob>> {
        return this.downloadPdf('/Reports/overtimes/download-pdf', { page, pageSize, payroll, numPeriod, search, filterDates });
    }

    public downloadPdfHoursWorked({ page = 1, pageSize = 30, payroll = 1, numPeriod = 1, search = '', filterDates }: IFilterReports): Observable<HttpResponse<Blob>> {
        return this.downloadPdf('/Reports/hours-worked/download-pdf', { page, pageSize, payroll, numPeriod, search, filterDates });
    }

    public downloadPdfAttendance({ page = 1, pageSize = 30, payroll = 1, numPeriod = 1, search = '', filterDates }: IFilterReports): Observable<HttpResponse<Blob>> {
        return this.downloadPdf('/Reports/attendance/download-pdf', { page, pageSize, payroll, numPeriod, search, filterDates });
    }

    public downloadPdfIncidences({ page = 1, pageSize = 30, payroll = 1, numPeriod = 1, search = '', filterDates }: IFilterReports): Observable<HttpResponse<Blob>> {
        return this.downloadPdf('/Reports/incidences/download-pdf', { page, pageSize, payroll, numPeriod, search, filterDates });
    }

    private downloadPdf(url: string, { page = 1, pageSize = 30, payroll = 1, numPeriod = 1, search = '', filterDates }: IFilterReports): Observable<HttpResponse<Blob>> {
        return this.httpService.get(url, {
            observe: 'response',
            responseType: 'blob',
            params: {
                'Paginator.Page': page,
                'Paginator.PageSize': pageSize,
                TypeNomina: payroll,
                NumPeriod: numPeriod,
                Search: search,
                ...(filterDates && {
                    'FilterDates.Start': filterDates.start.toISOString(),
                    'FilterDates.End': filterDates.end.toISOString(),
                }),
            }
        });
    }

    public getHttpResponseFileName(response: HttpResponse<Blob>, defaultName: string): string {
        const contentDisposition = response.headers.get('Content-Disposition');
        if (contentDisposition) {
            const matches = /filename="?(?<filename>[^"]+);"?/.exec(contentDisposition);

            if (matches && matches.groups && matches.groups['filename']) {
                return matches.groups['filename'];
            }
        }

        return defaultName;
    }

    // ==================== OVERTIME ACCUMULATION ====================

    /**
     * Verifica si hay horas extras pendientes en un periodo
     */
    public checkPendingOvertimes(typeNomina: number, numPeriod: number): Observable<{ hasPending: boolean; count: number }> {
        return this.httpService.get<{ hasPending: boolean; count: number }>('/OvertimeAccumulation/has-pending', {
            params: { typeNomina, numPeriod }
        });
    }

    /**
     * Obtiene el resumen de horas extras con opciones de acumulación
     */
    public getOvertimeSummary(typeNomina: number, numPeriod: number, search: string = ''): Observable<IOvertimeSummary[]> {
        return this.httpService.get<IOvertimeSummary[]>('/OvertimeAccumulation/summary', {
            params: {
                typeNomina,
                numPeriod,
                search
            }
        });
    }

    /**
     * Obtiene el balance de acumulación de un empleado
     */
    public getEmployeeBalance(employeeCode: number): Observable<IOvertimeAccumulation> {
        return this.httpService.get<IOvertimeAccumulation>(`/OvertimeAccumulation/balance/${employeeCode}`);
    }

    /**
     * Acumula horas extras
     */
    public accumulateOvertime(input: IAccumulateOvertimeInput): Observable<IOvertimeOperationResult> {
        return this.httpService.post<IOvertimeOperationResult>('/OvertimeAccumulation/accumulate', input);
    }

    /**
     * Registra pago directo de horas extras
     */
    public payOvertimeDirect(input: IPayOvertimeDirectInput): Observable<IOvertimeOperationResult> {
        return this.httpService.post<IOvertimeOperationResult>('/OvertimeAccumulation/pay-direct', input);
    }

    /**
     * Usa horas acumuladas para día de descanso
     */
    public useOvertimeForRestDay(input: IUseOvertimeForRestDayInput): Observable<IOvertimeOperationResult> {
        return this.httpService.post<IOvertimeOperationResult>('/OvertimeAccumulation/use-for-rest-day', input);
    }

    /**
     * Cancela un movimiento previo
     */
    public cancelOvertimeMovement(input: ICancelOvertimeMovementInput): Observable<IOvertimeOperationResult> {
        return this.httpService.post<IOvertimeOperationResult>('/OvertimeAccumulation/cancel', input);
    }

    /**
     * Obtiene el historial de movimientos
     */
    public getOvertimeMovements(params: {
        employeeCode?: number;
        startDate?: string;
        endDate?: string;
        movementType?: OvertimeMovementType;
        page?: number;
        pageSize?: number;
    }): Observable<IOvertimeMovementsPaged> {
        return this.httpService.get<IOvertimeMovementsPaged>('/OvertimeAccumulation/movements', {
            params: params as any
        });
    }

    /**
     * Envia horas extras a banco de horas
     */
    public sendToHourBank(input: ISendToHourBankInput): Observable<IOvertimeOperationResult> {
        return this.httpService.post<IOvertimeOperationResult>('/OvertimeAccumulation/hour-bank', input);
    }

    /**
     * Agrega registro manual de horas extras (sistema externo)
     */
    public addManualOvertimeEntry(input: IManualOvertimeEntryInput): Observable<IOvertimeOperationResult> {
        return this.httpService.post<IOvertimeOperationResult>('/OvertimeAccumulation/manual-entry', input);
    }

    /**
     * Previsualiza los renglones de pago de tiempo extra autorizado (concepto/importe/fecha/horas).
     */
    public getOvertimePaymentPreview(typeNomina: number, numPeriod: number): Observable<IOvertimePaymentLine[]> {
        return this.httpService.get<IOvertimePaymentLine[]>('/OvertimePaymentFile/preview', {
            params: { typeNomina, numPeriod }
        });
    }

    /**
     * Estado de generación del archivo de tiempo extra del periodo (indicador anti doble-pago).
     */
    public getOvertimePaymentStatus(typeNomina: number, numPeriod: number): Observable<IOvertimePaymentFileStatus> {
        return this.httpService.get<IOvertimePaymentFileStatus>('/OvertimePaymentFile/status', {
            params: { typeNomina, numPeriod }
        });
    }

    /**
     * Descarga el archivo XLSX de importación de tiempo extra autorizado
     * (CODIGO | CONCEPTO | IMPORTE | FECHA | HORAS) repartido en conceptos 11/12/13.
     */
    public downloadOvertimePaymentFile(typeNomina: number, numPeriod: number): Observable<HttpResponse<Blob>> {
        return this.httpService.get('/OvertimePaymentFile/download', {
            observe: 'response',
            responseType: 'blob',
            params: { typeNomina, numPeriod }
        });
    }

    /**
     * Procesa horas extras en lote
     */
    public processOvertimesBatch(input: IProcessOvertimesBatchInput): Observable<{
        totalProcessed: number;
        successCount: number;
        failCount: number;
        details: IOvertimeOperationResult[];
    }> {
        return this.httpService.post<any>('/OvertimeAccumulation/process-batch', input);
    }
}