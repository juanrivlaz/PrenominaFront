import { CommonModule } from "@angular/common";
import { Component, inject, model, ViewEncapsulation } from "@angular/core";
import { MaterialModule } from "../../../shared/modules/material/material.module";
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { IAssignTimeOff } from "./assign-time-off.interface";
import dayjs from "dayjs";
import { MatSelectModule } from "@angular/material/select";
import { DialogModule } from "@shared/modules/material/dialog.module";

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

    constructor() {
        this.timeOffForm = new FormGroup({
            incidentCode: new FormControl('', {
                validators: [Validators.required],
            }),
        });
    }

    public get incidentCodeControl(): AbstractControl {
        return this.timeOffForm.get('incidentCode')!;
    }

    public onCancel(): void {
        this.dialogRef.close();
    }

    public get datesFormat(): Array<string> {
        return this.data.dates.map(item => dayjs(item).format('dddd, DD [de] MMMM [del] YYYY'));
    }

    public submit(): void {
        this.dialogRef.close(this.timeOffForm.value);
    }
}