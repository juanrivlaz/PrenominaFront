import { CommonModule } from "@angular/common";
import { Component, inject, signal } from "@angular/core";
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogRef, MatDialogTitle } from "@angular/material/dialog";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatNativeDateModule } from "@angular/material/core";
import { MaterialModule } from "@shared/modules/material/material.module";
import { IPrenominaPeriod } from "@core/models/prenomina-period.interface";
import { PeriodService } from "../period.service";
import { finalize } from "rxjs";
import dayjs from "dayjs";

export interface IEditPeriodData {
    period: IPrenominaPeriod;
}

@Component({
    selector: 'app-edit-period',
    imports: [
        CommonModule,
        MaterialModule,
        ReactiveFormsModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatDialogContent,
        MatDialogActions,
        MatDialogClose,
        MatDialogTitle
    ],
    templateUrl: './edit-period.component.html',
    styleUrl: './edit-period.component.scss',
    providers: [PeriodService],
})
export class EditPeriodComponent {
    public readonly data = inject<IEditPeriodData>(MAT_DIALOG_DATA);
    private readonly dialogRef = inject(MatDialogRef<EditPeriodComponent>);
    private readonly service = inject(PeriodService);

    public readonly loading = signal(false);
    public readonly errorMessage = signal<string | null>(null);
    public readonly form: FormGroup;

    constructor() {
        this.dialogRef.disableClose = true;
        const p = this.data.period;
        this.form = new FormGroup({
            startDate: new FormControl<Date | null>(p.startDate ? new Date(p.startDate) : null, [Validators.required]),
            closingDate: new FormControl<Date | null>(p.closingDate ? new Date(p.closingDate) : null, [Validators.required]),
            datePayment: new FormControl<Date | null>(p.datePayment ? new Date(p.datePayment) : null, [Validators.required]),
            startAdminDate: new FormControl<Date | null>(p.startAdminDate ? new Date(p.startAdminDate) : null, [Validators.required]),
            closingAdminDate: new FormControl<Date | null>(p.closingAdminDate ? new Date(p.closingAdminDate) : null, [Validators.required]),
        });
    }

    public submit(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        const v = this.form.value;
        const payload = {
            startDate: dayjs(v.startDate).format('YYYY-MM-DD'),
            closingDate: dayjs(v.closingDate).format('YYYY-MM-DD'),
            datePayment: dayjs(v.datePayment).format('YYYY-MM-DD'),
            startAdminDate: dayjs(v.startAdminDate).format('YYYY-MM-DD'),
            closingAdminDate: dayjs(v.closingAdminDate).format('YYYY-MM-DD'),
        };

        this.loading.set(true);
        this.errorMessage.set(null);
        this.service.update(this.data.period.id, payload)
            .pipe(finalize(() => this.loading.set(false)))
            .subscribe({
                next: () => this.dialogRef.close(true),
                error: (err) => this.errorMessage.set(err.error?.message || 'Error al guardar el periodo'),
            });
    }
}
