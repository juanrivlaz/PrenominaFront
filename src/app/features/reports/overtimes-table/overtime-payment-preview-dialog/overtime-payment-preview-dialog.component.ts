import { Component, computed, Inject, inject, OnDestroy, OnInit, signal, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, finalize, takeUntil } from 'rxjs';
import { IOvertimePaymentLine } from '@core/models/reports/overtime-payment-line.interface';
import { IOvertimePaymentFileStatus } from '@core/models/reports/overtime-payment-file-status.interface';
import { ReportsService } from '../../reports.service';

export interface OvertimePaymentPreviewDialogData {
    typeNomina: number;
    numPeriod: number;
    service: ReportsService;
}

@Component({
    selector: 'app-overtime-payment-preview-dialog',
    templateUrl: './overtime-payment-preview-dialog.component.html',
    styleUrl: './overtime-payment-preview-dialog.component.scss',
    imports: [
        CommonModule,
        MatDialogModule,
        MatButtonModule,
        MatIconModule,
        MatTableModule,
        MatProgressSpinnerModule,
        MatFormFieldModule,
        MatInputModule,
    ],
})
export class OvertimePaymentPreviewDialogComponent implements OnInit, OnDestroy {
    private readonly destroy$ = new Subject<void>();
    private readonly snackBar = inject(MatSnackBar);

    public readonly columns: Array<string> = ['employeeCode', 'fullName', 'jobPosition', 'concept', 'importe', 'date', 'hours'];

    public loading: WritableSignal<boolean> = signal(false);
    public downloading: WritableSignal<boolean> = signal(false);
    public lines: WritableSignal<IOvertimePaymentLine[]> = signal([]);
    public search: WritableSignal<string> = signal('');
    public status: WritableSignal<IOvertimePaymentFileStatus | null> = signal(null);
    public awaitingConfirm: WritableSignal<boolean> = signal(false);

    public readonly filteredLines = computed(() => {
        const term = this.search().toLowerCase().trim();
        if (!term) return this.lines();
        return this.lines().filter(l =>
            l.employeeCode.toString().includes(term) ||
            l.fullName.toLowerCase().includes(term) ||
            l.jobPosition.toLowerCase().includes(term)
        );
    });

    public readonly totalAmount = computed(() => this.filteredLines().reduce((sum, l) => sum + l.amount, 0));
    public readonly totalHours = computed(() => this.filteredLines().reduce((sum, l) => sum + l.hours, 0));

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: OvertimePaymentPreviewDialogData
    ) {}

    ngOnInit(): void {
        this.loadPreview();
        this.loadStatus();
    }

    public loadStatus(): void {
        this.data.service.getOvertimePaymentStatus(this.data.typeNomina, this.data.numPeriod)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (status) => this.status.set(status),
                error: () => { /* el indicador es informativo; no bloquea el preview */ }
            });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    public loadPreview(): void {
        this.loading.set(true);
        this.data.service.getOvertimePaymentPreview(this.data.typeNomina, this.data.numPeriod)
            .pipe(
                finalize(() => this.loading.set(false)),
                takeUntil(this.destroy$)
            )
            .subscribe({
                next: (data) => this.lines.set(data),
                error: () => this.showError('No se pudo cargar la previsualización'),
            });
    }

    public download(): void {
        // Si ya fue generado, exige una confirmación extra (evita pagar dos veces).
        if (this.status()?.generated && !this.awaitingConfirm()) {
            this.awaitingConfirm.set(true);
            return;
        }

        this.awaitingConfirm.set(false);
        this.downloading.set(true);
        this.data.service.downloadOvertimePaymentFile(this.data.typeNomina, this.data.numPeriod)
            .pipe(
                finalize(() => this.downloading.set(false)),
                takeUntil(this.destroy$)
            )
            .subscribe({
                next: (response) => {
                    const urlBlob = window.URL.createObjectURL(new Blob([response.body!]));
                    const link = document.createElement('a');
                    link.href = urlBlob;
                    link.download = this.data.service.getHttpResponseFileName(
                        response,
                        `tiempo-extra-periodo-${this.data.numPeriod}.xlsx`
                    );
                    link.click();
                    window.URL.revokeObjectURL(urlBlob);
                    // Refresca el indicador (ahora queda marcado como generado).
                    this.loadStatus();
                },
                error: () => this.showError('No se pudo generar el archivo de tiempo extra'),
            });
    }

    public conceptLabel(concept: number): string {
        switch (concept) {
            case 11: return '11 · Doble (1-3 h)';
            case 12: return '12 · Doble (4ª h)';
            case 13: return '13 · Triple';
            default: return concept.toString();
        }
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
