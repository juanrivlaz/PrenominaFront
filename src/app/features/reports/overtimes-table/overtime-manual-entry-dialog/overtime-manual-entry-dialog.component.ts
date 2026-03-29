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

export interface OvertimeManualEntryDialogData {
    service: ReportsService;
}

@Component({
    selector: 'app-overtime-manual-entry-dialog',
    templateUrl: './overtime-manual-entry-dialog.component.html',
    styleUrl: './overtime-manual-entry-dialog.component.scss',
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
export class OvertimeManualEntryDialogComponent implements OnDestroy {
    private readonly destroy$ = new Subject<void>();
    private readonly snackBar = inject(MatSnackBar);

    public processing: WritableSignal<boolean> = signal(false);

    public form = new FormGroup({
        employeeCode: new FormControl<number | null>(null, [Validators.required, Validators.min(1)]),
        sourceDate: new FormControl<Date | null>(null, [Validators.required]),
        hours: new FormControl<number>(0, [Validators.required, Validators.min(0)]),
        minutes: new FormControl<number>(0, [Validators.required, Validators.min(0), Validators.max(59)]),
        externalReference: new FormControl<string>(''),
        notes: new FormControl<string>(''),
    });

    constructor(
        public dialogRef: MatDialogRef<OvertimeManualEntryDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: OvertimeManualEntryDialogData
    ) {}

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    getTotalMinutes(): number {
        return ((this.form.get('hours')?.value || 0) * 60) + (this.form.get('minutes')?.value || 0);
    }

    formatMinutes(minutes: number): string {
        const hrs = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hrs} hrs ${mins.toString().padStart(2, '0')} min`;
    }

    submit(): void {
        if (!this.form.valid || this.getTotalMinutes() === 0) return;

        this.processing.set(true);
        const sourceDate = this.form.get('sourceDate')?.value;

        this.data.service.addManualOvertimeEntry({
            employeeCode: this.form.get('employeeCode')?.value!,
            sourceDate: dayjs(sourceDate).format('YYYY-MM-DD'),
            minutes: this.getTotalMinutes(),
            notes: this.form.get('notes')?.value || '',
            externalReference: this.form.get('externalReference')?.value || '',
        })
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
                    err.error?.message || 'Error al registrar',
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
