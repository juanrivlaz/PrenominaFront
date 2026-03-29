import { Component, Inject, inject, OnDestroy, OnInit, signal, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, finalize, takeUntil } from 'rxjs';
import { ReportsService } from '../../reports.service';
import { IOvertimeMovementLog, OvertimeMovementType } from '@core/models/reports/overtime-accumulation.interface';
import dayjs from 'dayjs';

export interface OvertimeHistoryDialogData {
    employeeCode: number;
    employeeName: string;
    service: ReportsService;
}

@Component({
    selector: 'app-overtime-history-dialog',
    templateUrl: './overtime-history-dialog.component.html',
    styleUrl: './overtime-history-dialog.component.scss',
    imports: [
        CommonModule,
        MatDialogModule,
        MatTableModule,
        MatPaginatorModule,
        MatButtonModule,
        MatIconModule,
        MatChipsModule,
        MatTooltipModule,
    ],
})
export class OvertimeHistoryDialogComponent implements OnInit, OnDestroy {
    private readonly destroy$ = new Subject<void>();

    public loading: WritableSignal<boolean> = signal(false);
    public movements: WritableSignal<IOvertimeMovementLog[]> = signal([]);
    public totalRecords: WritableSignal<number> = signal(0);
    public page = 1;
    public pageSize = 10;

    public readonly columns = ['date', 'type', 'sourceDate', 'minutes', 'balance', 'user', 'notes', 'status'];

    constructor(
        public dialogRef: MatDialogRef<OvertimeHistoryDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: OvertimeHistoryDialogData
    ) {}

    ngOnInit(): void {
        this.loadMovements();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    loadMovements(): void {
        this.loading.set(true);
        this.data.service.getOvertimeMovements({
            employeeCode: this.data.employeeCode,
            page: this.page,
            pageSize: this.pageSize
        })
        .pipe(
            finalize(() => this.loading.set(false)),
            takeUntil(this.destroy$)
        )
        .subscribe({
            next: (response) => {
                this.movements.set(response.items);
                this.totalRecords.set(response.totalRecords);
            }
        });
    }

    handlePageChange(event: PageEvent): void {
        this.page = event.pageIndex + 1;
        this.pageSize = event.pageSize;
        this.loadMovements();
    }

    formatDate(date: string): string {
        return dayjs(date).format('DD/MM/YYYY HH:mm');
    }

    truncateNotes(notes: string): string {
        return notes.length > 30 ? notes.substring(0, 30) + '...' : notes;
    }

    getTypeClass(type: OvertimeMovementType): string {
        switch (type) {
            case OvertimeMovementType.Accumulation:
                return 'type-accumulation';
            case OvertimeMovementType.DirectPayment:
                return 'type-payment';
            case OvertimeMovementType.UsedForRestDay:
                return 'type-rest-day';
            case OvertimeMovementType.ManualAdjustment:
                return 'type-adjustment';
            case OvertimeMovementType.Cancellation:
                return 'type-cancellation';
            case OvertimeMovementType.HourBank:
                return 'type-hour-bank';
            case OvertimeMovementType.ExternalEntry:
                return 'type-external';
            default:
                return '';
        }
    }
}
