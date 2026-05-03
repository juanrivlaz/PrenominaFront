import { CommonModule } from "@angular/common";
import { Component, inject, signal, ViewEncapsulation } from "@angular/core";
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogRef, MatDialogTitle } from "@angular/material/dialog";
import { MatSlideToggleModule } from "@angular/material/slide-toggle";
import { MaterialModule } from "@shared/modules/material/material.module";
import { Observable, finalize } from "rxjs";
import { WorkScheduleService } from "../work-schedule.service";
import { IWorkScheduleFormData } from "./work-schedule-form.interface";
import { IWorkSchedule, IWorkScheduleInput } from "@core/models/work-schedule.interface";

@Component({
    selector: 'app-work-schedule-form',
    imports: [
        CommonModule,
        MaterialModule,
        ReactiveFormsModule,
        MatSlideToggleModule,
        MatDialogContent,
        MatDialogActions,
        MatDialogClose,
        MatDialogTitle
    ],
    providers: [WorkScheduleService],
    templateUrl: './work-schedule-form.component.html',
    styleUrl: './work-schedule-form.component.scss',
    encapsulation: ViewEncapsulation.None
})
export class WorkScheduleFormComponent {
    public readonly data = inject<IWorkScheduleFormData>(MAT_DIALOG_DATA);
    private readonly dialogRef = inject(MatDialogRef<WorkScheduleFormComponent>);

    public readonly loading = signal(false);
    public readonly form: FormGroup;

    constructor(private readonly service: WorkScheduleService) {
        this.dialogRef.disableClose = true;

        const sched = this.data.schedule;
        this.form = new FormGroup({
            label: new FormControl(sched?.label ?? '', [Validators.required]),
            startTime: new FormControl(sched?.startTime?.substring(0, 5) ?? '', [Validators.required]),
            endTime: new FormControl(sched?.endTime?.substring(0, 5) ?? '', [Validators.required]),
            workHours: new FormControl(sched?.workHours ?? 8, [Validators.required, Validators.min(0)]),
            isNightShift: new FormControl(sched?.isNightShift ?? false),
            breakStart: new FormControl(sched?.breakStart?.substring(0, 5) ?? ''),
            breakEnd: new FormControl(sched?.breakEnd?.substring(0, 5) ?? '')
        });
    }

    public submit(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        const value = this.form.value;
        const payload: IWorkScheduleInput = {
            label: value.label,
            startTime: this.toApiTime(value.startTime),
            endTime: this.toApiTime(value.endTime),
            workHours: Number(value.workHours),
            isNightShift: !!value.isNightShift,
            breakStart: value.breakStart ? this.toApiTime(value.breakStart) : null,
            breakEnd: value.breakEnd ? this.toApiTime(value.breakEnd) : null
        };

        this.loading.set(true);
        const obs$: Observable<IWorkSchedule | boolean> = this.data.mode === 'edit' && this.data.schedule
            ? this.service.update(this.data.schedule.id, payload)
            : this.service.create(payload);

        obs$.pipe(finalize(() => this.loading.set(false))).subscribe({
            next: (result: IWorkSchedule | boolean) => this.dialogRef.close(result ?? true),
            error: (err: unknown) => console.error(err)
        });
    }

    private toApiTime(value: string): string {
        // input type=time entrega "HH:mm". El API espera TimeOnly.
        return value.length === 5 ? `${value}:00` : value;
    }
}
