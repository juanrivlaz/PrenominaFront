import { Component, Inject, inject, OnDestroy, signal, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, finalize, takeUntil } from 'rxjs';
import { ReportsService } from '../../reports.service';
import dayjs from 'dayjs';

export interface OvertimeMovementDialogData {
    employeeCode: number;
    employeeName: string;
    sourceDate?: string;
    minutes?: number;
    checkIn?: string;
    checkOut?: string;
    movementId?: number;
    currentBalance?: number;
    currentBalanceFormatted?: string;
    action: 'accumulate' | 'pay' | 'cancel' | 'use-rest-day' | 'hour-bank';
    // Mensaje de advertencia opcional mostrado de forma destacada (ej. cancelación en cascada).
    warningMessage?: string;
    service: ReportsService;
}

@Component({
    selector: 'app-overtime-movement-dialog',
    templateUrl: './overtime-movement-dialog.component.html',
    styleUrl: './overtime-movement-dialog.component.scss',
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatDialogModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatDatepickerModule,
    ],
})
export class OvertimeMovementDialogComponent implements OnDestroy {
    private readonly destroy$ = new Subject<void>();
    private readonly snackBar = inject(MatSnackBar);

    public processing: WritableSignal<boolean> = signal(false);
    public form: FormGroup;

    public readonly allowsPartial: boolean;

    constructor(
        public dialogRef: MatDialogRef<OvertimeMovementDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: OvertimeMovementDialogData
    ) {
        this.allowsPartial = ['accumulate', 'pay', 'hour-bank'].includes(data.action);

        const isRestDay = data.action === 'use-rest-day';
        const defaultMinutes = isRestDay
            ? (data.currentBalance ? Math.min(480, data.currentBalance) : 480)
            : (data.minutes || 0);

        this.form = new FormGroup({
            notes: new FormControl('', data.action === 'cancel' ? [Validators.required, Validators.minLength(10)] : []),
            restDate: new FormControl(null, isRestDay ? [Validators.required] : []),
            hoursToUse: new FormControl(
                Math.floor(defaultMinutes / 60),
                (isRestDay || this.allowsPartial) ? [Validators.required, Validators.min(0)] : []
            ),
            minutesToUse: new FormControl(
                defaultMinutes % 60,
                (isRestDay || this.allowsPartial) ? [Validators.required, Validators.min(0), Validators.max(59)] : []
            )
        });
    }

    getTotalMinutesToUse(): number {
        const hours = this.form.get('hoursToUse')?.value || 0;
        const minutes = this.form.get('minutesToUse')?.value || 0;
        return (hours * 60) + minutes;
    }

    isMinutesValid(): boolean {
        const total = this.getTotalMinutesToUse();
        if (this.data.action === 'use-rest-day') {
            return total > 0 && total <= (this.data.currentBalance || 0);
        }
        if (this.allowsPartial) {
            return total > 0 && total <= (this.data.minutes || 0);
        }
        return true;
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    getTitle(): string {
        switch (this.data.action) {
            case 'accumulate': return 'Acumular tiempo extra';
            case 'pay': return 'Pagar tiempo extra';
            case 'cancel': return 'Cancelar movimiento';
            case 'use-rest-day': return 'Aplicar dia de descanso';
            case 'hour-bank': return 'Descartar Horas';
            default: return '';
        }
    }

    getButtonText(): string {
        switch (this.data.action) {
            case 'accumulate': return 'Acumular';
            case 'pay': return 'Pagar';
            case 'cancel': return 'Cancelar movimiento';
            case 'use-rest-day': return 'Aplicar descanso';
            case 'hour-bank': return 'Descartar';
            default: return 'Confirmar';
        }
    }

    getButtonColor(): string {
        switch (this.data.action) {
            case 'accumulate': return 'primary';
            case 'pay': return 'accent';
            case 'cancel': return 'warn';
            case 'use-rest-day': return 'primary';
            case 'hour-bank': return 'primary';
            default: return 'primary';
        }
    }

    formatDate(date: string): string {
        return dayjs(date).format('DD/MM/YYYY');
    }

    formatMinutes(minutes: number): string {
        const hrs = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hrs} hrs ${mins.toString().padStart(2, '0')} min`;
    }

    submit(): void {
        if (!this.form.valid || !this.isMinutesValid()) return;

        this.processing.set(true);
        const notes = this.form.get('notes')?.value || '';
        const partialMinutes = this.allowsPartial ? this.getTotalMinutesToUse() : this.data.minutes!;

        let request;

        switch (this.data.action) {
            case 'accumulate':
                request = this.data.service.accumulateOvertime({
                    employeeCode: this.data.employeeCode,
                    sourceDate: this.data.sourceDate!,
                    minutes: partialMinutes,
                    checkIn: this.data.checkIn,
                    checkOut: this.data.checkOut,
                    notes
                });
                break;

            case 'pay':
                request = this.data.service.payOvertimeDirect({
                    employeeCode: this.data.employeeCode,
                    sourceDate: this.data.sourceDate!,
                    minutes: partialMinutes,
                    checkIn: this.data.checkIn,
                    checkOut: this.data.checkOut,
                    notes
                });
                break;

            case 'cancel':
                request = this.data.service.cancelOvertimeMovement({
                    movementId: this.data.movementId!,
                    reason: notes
                });
                break;

            case 'use-rest-day':
                const restDate = this.form.get('restDate')?.value;
                request = this.data.service.useOvertimeForRestDay({
                    employeeCode: this.data.employeeCode,
                    restDate: dayjs(restDate).format('YYYY-MM-DD'),
                    minutesToUse: this.getTotalMinutesToUse(),
                    notes
                });
                break;

            case 'hour-bank':
                request = this.data.service.sendToHourBank({
                    employeeCode: this.data.employeeCode,
                    sourceDate: this.data.sourceDate!,
                    minutes: partialMinutes,
                    checkIn: this.data.checkIn,
                    checkOut: this.data.checkOut,
                    notes
                });
                break;

            default:
                return;
        }

        request
            .pipe(
                finalize(() => this.processing.set(false)),
                takeUntil(this.destroy$)
            )
            .subscribe({
                next: (result) => {
                    this.dialogRef.close({ success: true, result });
                },
                error: (err) => {
                    this.snackBar.open(
                        err.error?.message || 'Error al procesar',
                        undefined,
                        {
                            horizontalPosition: 'center',
                            verticalPosition: 'top',
                            panelClass: 'alert-error',
                            duration: 3000
                        }
                    );
                }
            });
    }
}
