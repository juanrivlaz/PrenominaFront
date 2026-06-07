import { CommonModule } from "@angular/common";
import { Component, computed, inject, ViewEncapsulation } from "@angular/core";
import { MaterialModule } from "../../../shared/modules/material/material.module";
import { AbstractControl, FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { IAssignTimeOff } from "./assign-time-off.interface";
import { IAssignTimeOffOutput, IOvertimeUsage } from "./assign-time-off-output.interface";
import dayjs from "dayjs";
import { MatSelectModule } from "@angular/material/select";
import { DialogModule } from "@shared/modules/material/dialog.module";
import { toSignal } from "@angular/core/rxjs-interop";

@Component({
    selector: 'app-assign-time-off',
    imports: [
        CommonModule,
        MaterialModule,
        ReactiveFormsModule,
        MatSelectModule,
        DialogModule,
    ],
    templateUrl: './assign-time-off.component.html',
    styleUrl: './assign-time-off.component.scss',
    encapsulation: ViewEncapsulation.None
})
export class AssignTimeOffComponent {
    private readonly dialogRef = inject(MatDialogRef<AssignTimeOffComponent>);
    readonly data = inject<IAssignTimeOff>(MAT_DIALOG_DATA);
    public timeOffForm: FormGroup;

    /** Minutos disponibles de horas acumuladas. */
    public readonly availableMinutes = this.data.availableOvertimeMinutes ?? 0;

    /** Etiquetas formateadas por día (mismo orden que el FormArray). */
    public readonly dayLabels: Array<string> = this.data.dates.map(item =>
        dayjs(item).format('dddd, DD [de] MMMM [del] YYYY'));

    /** Total de minutos que se consumirán según el formulario. */
    public readonly totalOvertimeMinutes;
    /** Minutos restantes tras el consumo. */
    public readonly remainingMinutes;
    /** Indica si el consumo supera el balance disponible. */
    public readonly exceedsBalance;
    /** Activo cuando se marcó usar horas extra pero no se capturó ninguna. */
    public readonly overtimeUsageMissing;

    constructor() {
        const overtimeDays = new FormArray(
            this.data.dates.map(date => new FormGroup({
                date: new FormControl(dayjs(date).format('YYYY-MM-DD')),
                hours: new FormControl<number | null>(null, { validators: [Validators.min(0)] }),
                minutes: new FormControl<number | null>(null, {
                    validators: [Validators.min(0), Validators.max(59)],
                }),
            }))
        );

        this.timeOffForm = new FormGroup({
            incidentCode: new FormControl('', {
                validators: [Validators.required],
            }),
            requireAbsenceRequest: new FormControl(false),
            notes: new FormControl(''),
            useOvertime: new FormControl(false),
            overtimeDays,
        });

        const formValue = toSignal(this.timeOffForm.valueChanges, {
            initialValue: this.timeOffForm.value,
        });

        this.totalOvertimeMinutes = computed(() => {
            const value = formValue();
            if (!value?.useOvertime) {
                return 0;
            }
            return (value.overtimeDays ?? []).reduce(
                (acc: number, item: { hours?: number | null; minutes?: number | null }) =>
                    acc + this.toMinutes(item?.hours, item?.minutes),
                0
            );
        });

        this.remainingMinutes = computed(() => this.availableMinutes - this.totalOvertimeMinutes());
        this.exceedsBalance = computed(() => this.totalOvertimeMinutes() > this.availableMinutes);
        this.overtimeUsageMissing = computed(() =>
            !!formValue()?.useOvertime && this.totalOvertimeMinutes() <= 0
        );

        // Al usar horas extra, la papeleta es obligatoria: se marca y se bloquea
        // "¿Requiere solicitud de ausencia?" para garantizar su generación.
        const requireAbsenceRequest = this.timeOffForm.get('requireAbsenceRequest')!;
        this.timeOffForm.get('useOvertime')!.valueChanges.subscribe(useOvertime => {
            if (useOvertime) {
                requireAbsenceRequest.setValue(true);
                requireAbsenceRequest.disable({ emitEvent: false });
            } else {
                requireAbsenceRequest.enable({ emitEvent: false });
            }
        });
    }

    public get incidentCodeControl(): AbstractControl {
        return this.timeOffForm.get('incidentCode')!;
    }

    public get requireAbsenceRequest(): boolean {
        return this.timeOffForm.get('requireAbsenceRequest')!.value;
    }

    public get useOvertime(): boolean {
        return this.timeOffForm.get('useOvertime')!.value;
    }

    public get overtimeDays(): FormArray {
        return this.timeOffForm.get('overtimeDays') as FormArray;
    }

    public get canConfirm(): boolean {
        return this.timeOffForm.valid
            && !this.exceedsBalance()
            && !this.overtimeUsageMissing();
    }

    public onCancel(): void {
        this.dialogRef.close();
    }

    public formatMinutes(minutes: number): string {
        const safe = Math.max(0, Math.round(minutes));
        const hrs = Math.floor(safe / 60);
        const mins = safe % 60;
        return `${hrs} hrs ${mins.toString().padStart(2, '0')} min`;
    }

    /** Convierte horas y minutos capturados a minutos totales. Valores inválidos => 0. */
    private toMinutes(hours?: number | null, minutes?: number | null): number {
        const h = Math.max(0, Math.floor(Number(hours) || 0));
        const m = Math.max(0, Math.min(59, Math.floor(Number(minutes) || 0)));
        return h * 60 + m;
    }

    public submit(): void {
        const overtimeUsages: Array<IOvertimeUsage> = this.useOvertime
            ? this.overtimeDays.controls
                .map(control => ({
                    date: control.get('date')!.value as string,
                    minutes: this.toMinutes(control.get('hours')!.value, control.get('minutes')!.value),
                }))
                .filter(usage => usage.minutes > 0)
            : [];

        const output: IAssignTimeOffOutput = {
            incidentCode: this.incidentCodeControl.value,
            requireAbsenceRequest: this.requireAbsenceRequest,
            notes: this.timeOffForm.get('notes')!.value,
            overtimeUsages,
        };

        this.dialogRef.close(output);
    }
}
