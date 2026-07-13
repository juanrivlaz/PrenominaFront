import { CommonModule } from "@angular/common";
import { Component, computed, effect, inject, input, OnDestroy, OnInit, output, signal, untracked, viewChild, ViewEncapsulation, WritableSignal } from "@angular/core";
import { MatPaginator, MatPaginatorModule, PageEvent } from "@angular/material/paginator";
import { MatTableDataSource, MatTableModule } from "@angular/material/table";
import { MatExpansionModule } from "@angular/material/expansion";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatChipsModule } from "@angular/material/chips";
import { MatDialog, MatDialogModule } from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";
import { MatMenuModule } from "@angular/material/menu";
import { MatTabsModule } from "@angular/material/tabs";
import { MatDividerModule } from "@angular/material/divider";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { SelectionModel } from "@angular/cdk/collections";
import { IOvertimeSummary, IOvertimeDayDetail, OvertimeDayStatus, IOvertimeMovementLog, IOvertimeMovementsPaged } from "@core/models/reports/overtime-accumulation.interface";
import { IOvertimePaymentFileStatus } from "@core/models/reports/overtime-payment-file-status.interface";
import { IOvertimeReport } from "@core/models/reports/overtimes.interface";
import { ReportsService } from "../reports.service";
import { Subject, finalize, takeUntil } from "rxjs";
import { OvertimeMovementDialogComponent, OvertimeMovementDialogData } from "./overtime-movement-dialog/overtime-movement-dialog.component";
import { OvertimeHistoryDialogComponent, OvertimeHistoryDialogData } from "./overtime-history-dialog/overtime-history-dialog.component";
import { OvertimeManualEntryDialogComponent, OvertimeManualEntryDialogData } from "./overtime-manual-entry-dialog/overtime-manual-entry-dialog.component";
import { OvertimeBatchNotesDialogComponent, BatchNotesDialogData, BatchNotesDialogResult } from "./overtime-batch-notes-dialog/overtime-batch-notes-dialog.component";
import { OvertimePaymentPreviewDialogComponent, OvertimePaymentPreviewDialogData } from "./overtime-payment-preview-dialog/overtime-payment-preview-dialog.component";
import { appAnimations } from "@core/animations";
import dayjs from "dayjs";

@Component({
    selector: 'app-overtimes-table',
    templateUrl: './overtimes-table.component.html',
    styleUrl: './overtimes-table.component.scss',
    imports: [
        CommonModule,
        MatTableModule,
        MatPaginatorModule,
        MatExpansionModule,
        MatButtonModule,
        MatIconModule,
        MatTooltipModule,
        MatChipsModule,
        MatDialogModule,
        MatMenuModule,
        MatTabsModule,
        MatDividerModule,
        MatCheckboxModule,
    ],
    encapsulation: ViewEncapsulation.None,
    animations: appAnimations,
})
export class OvertimesTableComponent implements OnInit, OnDestroy {
    // Inputs usando signal-based API
    public readonly dataSource = input<MatTableDataSource<IOvertimeReport>>(new MatTableDataSource());
    public readonly totalRecords = input<number>(0);
    public readonly pageSize = input<number>(10);
    public readonly typeNomina = input<number>(0);
    public readonly numPeriod = input<number>(0);
    public readonly searchTerm = input<string>('');
    // Departamento/supervisor activo. Cambiarlo fuerza recargar el resumen (filtrado por tenant en el backend).
    public readonly tenant = input<string>('');
    // Rango de fechas para filtrar los días con tiempo extra mostrados.
    public readonly startDate = input<Date | null>(null);
    public readonly endDate = input<Date | null>(null);

    // Outputs usando signal-based API
    public readonly onPageChange = output<PageEvent>();
    public readonly onRefresh = output<void>();

    // ViewChild usando signal-based API
    public readonly paginator = viewChild<MatPaginator>(MatPaginator);

    private readonly destroy$ = new Subject<void>();
    private readonly dialog = inject(MatDialog);
    private readonly snackBar = inject(MatSnackBar);
    private readonly reportsService = inject(ReportsService);

    public readonly columns: Array<string> = [
        'expand',
        'code',
        'name',
        'department',
        'totalOvertime',
        'balance',
        'accumulated',
        'paidOvertime',
        'pending',
        'actions',
    ];

    public readonly dayColumns: Array<string> = [
        'select',
        'date',
        'checkIn',
        'checkOut',
        'overtime',
        'status',
        'actions',
    ];

    public daySelection = new SelectionModel<IOvertimeDayDetail>(true, []);

    public loading: WritableSignal<boolean> = signal(false);
    public summaryData: WritableSignal<IOvertimeSummary[]> = signal([]);
    public paymentFileStatus: WritableSignal<IOvertimePaymentFileStatus | null> = signal(null);
    public expandedEmployee: number | null = null;
    public activeTab: WritableSignal<'summary' | 'history'> = signal('summary');
    public statusFilter: WritableSignal<'all' | 'pending' | 'applied'> = signal('all');

    public readonly filteredData = computed(() => {
        let data = this.summaryData();
        const search = this.searchTerm()?.toLowerCase().trim();
        const filter = this.statusFilter();
        const start = this.startDate();
        const end = this.endDate();

        if (search) {
            data = data.filter(item =>
                item.employeeCode.toString().includes(search) ||
                item.fullName.toLowerCase().includes(search) ||
                item.department.toLowerCase().includes(search)
            );
        }

        // Filtro por rango de fechas: se acotan los días con tiempo extra al rango y se
        // recalculan los totales por empleado; se descartan empleados sin días en el rango.
        if (start && end) {
            const startStr = dayjs(start).format('YYYY-MM-DD');
            const endStr = dayjs(end).format('YYYY-MM-DD');

            data = data
                .map(item => {
                    const dayDetails = item.dayDetails.filter(d => {
                        const dateStr = dayjs(d.date).format('YYYY-MM-DD');
                        return dateStr >= startStr && dateStr <= endStr;
                    });

                    const totalOvertimeMinutes = dayDetails.reduce((sum, d) => sum + d.overtimeMinutes, 0);
                    const pendingMinutes = dayDetails
                        .filter(d => d.status === OvertimeDayStatus.Pending || d.status === OvertimeDayStatus.Cancelled)
                        .reduce((sum, d) => sum + d.overtimeMinutes, 0);

                    return {
                        ...item,
                        dayDetails,
                        totalOvertimeMinutes,
                        totalOvertimeFormatted: this.formatToTime(totalOvertimeMinutes),
                        pendingMinutes,
                    };
                })
                .filter(item => item.dayDetails.length > 0);
        }

        if (filter === 'pending') {
            data = data.filter(item => item.pendingMinutes > 0);
        } else if (filter === 'applied') {
            data = data.filter(item => item.pendingMinutes === 0);
        }

        return data;
    });

    constructor() {
        effect(() => {
            const type = this.typeNomina();
            const period = this.numPeriod();
            // Leer el tenant lo registra como dependencia: al cambiar de departamento se recarga.
            this.tenant();
            if (type && period) {
                untracked(() => this.loadSummaryData());
            }
        });
    }

    ngOnInit(): void {
        this.loadSummaryData();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    public loadSummaryData(): void {
        if (!this.typeNomina() || !this.numPeriod()) {
            return;
        }

        this.loading.set(true);
        this.reportsService.getOvertimeSummary(this.typeNomina(), this.numPeriod())
            .pipe(
                finalize(() => this.loading.set(false)),
                takeUntil(this.destroy$)
            )
            .subscribe({
                next: (data) => {
                    this.summaryData.set(data);
                },
                error: (err) => {
                    this.showError(err.error?.message || 'Error al cargar datos');
                }
            });

        this.loadPaymentFileStatus();
    }

    /**
     * Carga el indicador de "archivo ya generado" del periodo (anti doble-pago).
     */
    public loadPaymentFileStatus(): void {
        if (!this.typeNomina() || !this.numPeriod()) {
            return;
        }

        this.reportsService.getOvertimePaymentStatus(this.typeNomina(), this.numPeriod())
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (status) => this.paymentFileStatus.set(status),
                error: () => { /* indicador informativo; no interrumpe la vista */ }
            });
    }

    public toggleExpand(employeeCode: number): void {
        this.expandedEmployee = this.expandedEmployee === employeeCode ? null : employeeCode;
        this.daySelection.clear();
    }

    public getPendingDays(summary: IOvertimeSummary): IOvertimeDayDetail[] {
        return summary.dayDetails.filter(d => d.status === OvertimeDayStatus.Pending || d.status === OvertimeDayStatus.Cancelled);
    }

    public isAllPendingSelected(summary: IOvertimeSummary): boolean {
        const pending = this.getPendingDays(summary);
        return pending.length > 0 && pending.every(d => this.daySelection.isSelected(d));
    }

    public toggleAllPending(summary: IOvertimeSummary): void {
        if (this.isAllPendingSelected(summary)) {
            this.daySelection.clear();
        } else {
            this.getPendingDays(summary).forEach(d => this.daySelection.select(d));
        }
    }

    public isDaySelectable(day: IOvertimeDayDetail): boolean {
        return day.status === OvertimeDayStatus.Pending || day.status === OvertimeDayStatus.Cancelled;
    }

    public accumulateSelected(summary: IOvertimeSummary): void {
        const selected = this.daySelection.selected;
        if (selected.length === 0) return;

        const totalMin = selected.reduce((sum, d) => sum + d.overtimeMinutes, 0);
        const dates = this.getDayDates(selected);
        this.openBatchNotesDialog(
            'Acumular seleccionados',
            `Se acumularán ${selected.length} día(s) seleccionados de ${summary.fullName}.`,
            'Acumular',
            'primary',
            (notes) => this.processSelectedDays(summary, true, selected, notes),
            dates,
            totalMin
        );
    }

    public paySelected(summary: IOvertimeSummary): void {
        const selected = this.daySelection.selected;
        if (selected.length === 0) return;

        const totalMin = selected.reduce((sum, d) => sum + d.overtimeMinutes, 0);
        const dates = this.getDayDates(selected);
        this.openBatchNotesDialog(
            'Pagar seleccionados',
            `Se pagarán ${selected.length} día(s) seleccionados de ${summary.fullName}.`,
            'Pagar',
            'accent',
            (notes) => this.processSelectedDays(summary, false, selected, notes),
            dates,
            totalMin
        );
    }

    private processSelectedDays(summary: IOvertimeSummary, accumulate: boolean, days: IOvertimeDayDetail[], notes: string): void {
        this.loading.set(true);
        this.reportsService.processOvertimesBatch({
            typeNomina: this.typeNomina(),
            numPeriod: this.numPeriod(),
            accumulate,
            employeeCodes: [summary.employeeCode],
            notes
        })
        .pipe(
            finalize(() => this.loading.set(false)),
            takeUntil(this.destroy$)
        )
        .subscribe({
            next: (result) => {
                if (accumulate) {
                    this.showSuccess(`${result.successCount} registros acumulados`);
                } else {
                    this.showSuccess(`Se generó la solicitud de pago de horas extras (${result.successCount} registros). Quedó pendiente de firmas.`);
                }
                this.daySelection.clear();
                this.loadSummaryData();
                this.onRefresh.emit();
            },
            error: (err) => {
                this.showError(err.error?.message || 'Error al procesar');
            }
        });
    }

    public isExpanded(employeeCode: number): boolean {
        return this.expandedEmployee === employeeCode;
    }

    public getStatusClass(status: OvertimeDayStatus): string {
        switch (status) {
            case OvertimeDayStatus.Pending:
                return 'status-pending';
            case OvertimeDayStatus.Accumulated:
                return 'status-accumulated';
            case OvertimeDayStatus.Paid:
                return 'status-paid';
            case OvertimeDayStatus.Cancelled:
                return 'status-cancelled';
            case OvertimeDayStatus.HourBank:
                return 'status-hour-bank';
            default:
                return '';
        }
    }

    public accumulateDay(summary: IOvertimeSummary, day: IOvertimeDayDetail): void {
        this.openMovementDialog(summary, day, 'accumulate');
    }

    public payDirectDay(summary: IOvertimeSummary, day: IOvertimeDayDetail): void {
        this.openMovementDialog(summary, day, 'pay');
    }

    public sendToHourBank(summary: IOvertimeSummary, day: IOvertimeDayDetail): void {
        this.openMovementDialog(summary, day, 'hour-bank');
    }

    public cancelMovement(summary: IOvertimeSummary, day: IOvertimeDayDetail): void {
        if (!day.movementId) return;

        this.openMovementDialog(summary, day, 'cancel');
    }

    public useForRestDay(summary: IOvertimeSummary): void {
        const dialogData: OvertimeMovementDialogData = {
            employeeCode: summary.employeeCode,
            employeeName: summary.fullName,
            currentBalance: summary.currentBalance,
            currentBalanceFormatted: summary.currentBalanceFormatted,
            action: 'use-rest-day',
            service: this.reportsService
        };

        const dialogRef = this.dialog.open(OvertimeMovementDialogComponent, {
            width: '500px',
            data: dialogData
        });

        dialogRef.afterClosed()
            .pipe(takeUntil(this.destroy$))
            .subscribe(result => {
                if (result?.success) {
                    this.showSuccess('Descanso aplicado correctamente');
                    this.loadSummaryData();
                    this.onRefresh.emit();
                }
            });
    }

    public accumulateAll(summary: IOvertimeSummary): void {
        const pendingDays = summary.dayDetails.filter(d => d.status === OvertimeDayStatus.Pending || d.status === OvertimeDayStatus.Cancelled);

        if (pendingDays.length === 0) {
            this.showError('No hay días pendientes por acumular');
            return;
        }

        const totalMin = pendingDays.reduce((sum, d) => sum + d.overtimeMinutes, 0);
        const dates = this.getDayDates(pendingDays);
        this.openBatchNotesDialog(
            'Acumular todo',
            `Se acumularán ${pendingDays.length} día(s) pendientes de ${summary.fullName}.`,
            'Acumular',
            'primary',
            (notes: string) => this.processBatch(summary.employeeCode, true, pendingDays, notes),
            dates,
            totalMin
        );
    }

    public payAllDirect(summary: IOvertimeSummary): void {
        const pendingDays = summary.dayDetails.filter(d => d.status === OvertimeDayStatus.Pending || d.status === OvertimeDayStatus.Cancelled);

        if (pendingDays.length === 0) {
            this.showError('No hay días pendientes por pagar');
            return;
        }

        const totalMin = pendingDays.reduce((sum, d) => sum + d.overtimeMinutes, 0);
        const dates = this.getDayDates(pendingDays);
        this.openBatchNotesDialog(
            'Pagar todo',
            `Se pagarán ${pendingDays.length} día(s) pendientes de ${summary.fullName}.`,
            'Pagar',
            'accent',
            (notes: string) => this.processBatch(summary.employeeCode, false, pendingDays, notes),
            dates,
            totalMin
        );
    }

    public viewHistory(summary: IOvertimeSummary): void {
        this.dialog.open<OvertimeHistoryDialogComponent, OvertimeHistoryDialogData>(OvertimeHistoryDialogComponent, {
            width: '80%',
            maxWidth: '1024px',
            data: {
                employeeCode: summary.employeeCode,
                employeeName: summary.fullName,
                service: this.reportsService
            }
        });
    }

    public openManualEntry(): void {
        const dialogRef = this.dialog.open<OvertimeManualEntryDialogComponent, OvertimeManualEntryDialogData>(OvertimeManualEntryDialogComponent, {
            width: '500px',
            data: { service: this.reportsService }
        });

        dialogRef.afterClosed()
            .pipe(takeUntil(this.destroy$))
            .subscribe(result => {
                if (result?.success) {
                    this.showSuccess('Registro externo agregado correctamente');
                    this.loadSummaryData();
                    this.onRefresh.emit();
                }
            });
    }

    public processAllPending(accumulate: boolean): void {
        const data = this.summaryData();
        const totalPending = data.reduce((sum, s) => sum + s.pendingMinutes, 0);

        if (totalPending === 0) {
            this.showError('No hay horas pendientes por procesar');
            return;
        }

        const allPendingDays = data.flatMap(s => s.dayDetails.filter(d => d.status === OvertimeDayStatus.Pending));
        const dates = this.getDayDates(allPendingDays);
        const action = accumulate ? 'acumular' : 'pagar';
        this.openBatchNotesDialog(
            `${accumulate ? 'Acumular' : 'Pagar'} todos`,
            `Se van a ${action} todas las horas pendientes de todos los empleados.`,
            accumulate ? 'Acumular' : 'Pagar',
            accumulate ? 'primary' : 'accent',
            (notes) => {
                this.loading.set(true);
                this.reportsService.processOvertimesBatch({
                    typeNomina: this.typeNomina(),
                    numPeriod: this.numPeriod(),
                    accumulate,
                    notes
                })
                .pipe(
                    finalize(() => this.loading.set(false)),
                    takeUntil(this.destroy$)
                )
                .subscribe({
                    next: (result) => {
                        if (accumulate) {
                            this.showSuccess(
                                `Procesados ${result.successCount} de ${result.totalProcessed} registros`
                            );
                        } else {
                            this.showSuccess(
                                `Se generaron las solicitudes de pago de horas extras (${result.successCount} de ${result.totalProcessed} registros). Quedaron pendientes de firmas.`
                            );
                        }
                        this.loadSummaryData();
                        this.onRefresh.emit();
                    },
                    error: (err) => {
                        this.showError(err.error?.message || 'Error al procesar');
                    }
                });
            },
            dates,
            totalPending
        );
    }

    /**
     * Abre la previsualización de los renglones de tiempo extra autorizado (conceptos 11/12/13),
     * desde donde se puede descargar el archivo XLSX de importación.
     */
    public openPaymentPreview(): void {
        if (!this.typeNomina() || !this.numPeriod()) {
            this.showError('Selecciona un periodo válido');
            return;
        }

        const dialogRef = this.dialog.open<OvertimePaymentPreviewDialogComponent, OvertimePaymentPreviewDialogData>(
            OvertimePaymentPreviewDialogComponent,
            {
                width: '90%',
                maxWidth: '820px',
                data: {
                    typeNomina: this.typeNomina(),
                    numPeriod: this.numPeriod(),
                    service: this.reportsService
                }
            }
        );

        // Al cerrar, refresca el indicador por si se (re)generó el archivo.
        dialogRef.afterClosed()
            .pipe(takeUntil(this.destroy$))
            .subscribe(() => this.loadPaymentFileStatus());
    }

    public getFilteredDayDetails(dayDetails: IOvertimeDayDetail[]): IOvertimeDayDetail[] {
        const filter = this.statusFilter();
        if (filter === 'all') return dayDetails;
        if (filter === 'pending') return dayDetails.filter(d => d.status === OvertimeDayStatus.Pending || d.status === OvertimeDayStatus.Cancelled);
        return dayDetails.filter(d => d.status !== OvertimeDayStatus.Pending && d.status !== OvertimeDayStatus.Cancelled);
    }

    public formatToTime(minutes: number): string {
        const isNegative = minutes < 0;
        minutes = Math.abs(minutes);
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        const formatted = `${hours.toString().padStart(2, '0')} hrs ${mins.toString().padStart(2, '0')} min`;
        return isNegative ? `-${formatted}` : formatted;
    }

    public formatTime(time: string): string {
        if (!time) return '--';
        return time.substring(0, 5);
    }

    public formatDate(date: string): string {
        if (!date) return '--';
        const d = new Date(date);
        return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
    }

    private getDayDates(days: IOvertimeDayDetail[]): string[] {
        return [...new Set(days.map(d => this.formatDate(d.date)))];
    }

    private openBatchNotesDialog(title: string, message: string, confirmText: string, confirmColor: string, onConfirm: (notes: string) => void, dates?: string[], totalMinutes?: number): void {
        const dialogRef = this.dialog.open<OvertimeBatchNotesDialogComponent, BatchNotesDialogData, BatchNotesDialogResult>(OvertimeBatchNotesDialogComponent, {
            width: '450px',
            data: { title, message, confirmText, confirmColor, dates, totalMinutes }
        });

        dialogRef.afterClosed()
            .pipe(takeUntil(this.destroy$))
            .subscribe(result => {
                if (result?.confirmed) {
                    onConfirm(result.notes);
                }
            });
    }

    private openMovementDialog(summary: IOvertimeSummary, day: IOvertimeDayDetail, action: 'accumulate' | 'pay' | 'cancel' | 'hour-bank'): void {
        // Cancelar un día pagado con papeleta pendiente elimina toda la solicitud en cascada.
        const isPaidWithRequest = action === 'cancel' && day.status === OvertimeDayStatus.Paid && !!day.paymentRequestId;

        const dialogData: OvertimeMovementDialogData = {
            employeeCode: summary.employeeCode,
            employeeName: summary.fullName,
            sourceDate: day.date,
            minutes: day.overtimeMinutes,
            checkIn: day.checkIn,
            checkOut: day.checkOut,
            movementId: day.movementId,
            action,
            warningMessage: isPaidWithRequest
                ? 'Al cancelar este pago se eliminará la solicitud de pago asociada y se revertirán TODAS las horas extras relacionadas a esa solicitud (volverán a pendientes). Esta acción no se puede deshacer.'
                : undefined,
            service: this.reportsService
        };

        const dialogRef = this.dialog.open<OvertimeMovementDialogComponent, OvertimeMovementDialogData>(OvertimeMovementDialogComponent,  {
            width: '500px',
            data: dialogData
        });

        dialogRef.afterClosed()
            .pipe(takeUntil(this.destroy$))
            .subscribe(result => {
                if (result?.success) {
                    if (action === 'pay') {
                        this.showSuccess('Se generó la solicitud de pago de horas extras. Quedó pendiente de firmas.');
                    } else if (isPaidWithRequest) {
                        this.showSuccess('Solicitud de pago eliminada. Las horas extras relacionadas volvieron a pendientes.');
                    } else if (action === 'hour-bank') {
                        this.showSuccess('Horas descartadas correctamente');
                    } else {
                        const actionLabel = action === 'accumulate' ? 'acumulado' : 'cancelado';
                        this.showSuccess(`Movimiento ${actionLabel} correctamente`);
                    }
                    this.loadSummaryData();
                    this.onRefresh.emit();
                }
            });
    }

    private processBatch(employeeCode: number, accumulate: boolean, days: IOvertimeDayDetail[], notes?: string): void {
        this.loading.set(true);
        this.reportsService.processOvertimesBatch({
            typeNomina: this.typeNomina(),
            numPeriod: this.numPeriod(),
            accumulate,
            employeeCodes: [employeeCode],
            notes
        })
        .pipe(
            finalize(() => this.loading.set(false)),
            takeUntil(this.destroy$)
        )
        .subscribe({
            next: (result) => {
                if (accumulate) {
                    this.showSuccess(`${result.successCount} registros acumulados`);
                } else {
                    this.showSuccess(`Se generó la solicitud de pago de horas extras (${result.successCount} registros). Quedó pendiente de firmas.`);
                }
                this.loadSummaryData();
                this.onRefresh.emit();
            },
            error: (err) => {
                this.showError(err.error?.message || 'Error al procesar');
            }
        });
    }

    private showSuccess(message: string): void {
        this.snackBar.open(message, undefined, {
            horizontalPosition: 'center',
            verticalPosition: 'top',
            panelClass: 'alert-success',
            duration: 3000
        });
    }

    private showError(message: string): void {
        this.snackBar.open(message, undefined, {
            horizontalPosition: 'center',
            verticalPosition: 'top',
            panelClass: 'alert-error',
            duration: 3000
        });
    }
}
