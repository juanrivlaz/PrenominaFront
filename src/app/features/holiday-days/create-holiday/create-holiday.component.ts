import { CommonModule } from "@angular/common";
import { Component, inject, ViewEncapsulation } from "@angular/core";
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogRef, MatDialogTitle } from "@angular/material/dialog";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatSelectModule } from "@angular/material/select";
import { MaterialModule } from "@shared/modules/material/material.module";
import { ICreateHoliday } from "./create-holiday.interface";
import dayjs from "dayjs";

@Component({
    selector: 'app-create-holiday',
    imports: [
        CommonModule,
        MaterialModule,
        MatDialogContent,
        MatDialogActions,
        MatDialogClose,
        MatDialogTitle,
        ReactiveFormsModule,
        MatSelectModule,
        MatDatepickerModule
    ],
    templateUrl: './create-holiday.component.html',
    styleUrl: './create-holiday.component.scss',
    encapsulation: ViewEncapsulation.None
})
export class CreateHolidayComponent {
    public readonly data = inject<ICreateHoliday>(MAT_DIALOG_DATA);
    public readonly dialogRef = inject(MatDialogRef<CreateHolidayComponent>);
    public createForm: FormGroup;
    public startDate: Date = new Date();
    public isEdit: boolean = false;

    public constructor() {
        this.createForm = new FormGroup({
            date: new FormControl('', { validators: [Validators.required ] }),
            description: new FormControl(''),
            isUnion: new FormControl(false),
            incidentCode: new FormControl('', { validators: [Validators.required ] }),
        });

        if (this.data?.holiday) {
            this.isEdit = true;
            this.createForm.get('date')?.setValue(dayjs(this.data.holiday.date).format('YYYY-MM-DD'));
            this.createForm.get('description')?.setValue(this.data.holiday.description);
            this.createForm.get('isUnion')?.setValue(this.data.holiday.isUnion);
            this.createForm.get('incidentCode')?.setValue(this.data.holiday.incidentCode);
        }
    }

    public getFieldControl(key: string): AbstractControl | null {
        return this.createForm.get(key);
    }

    public submit(): void {
        this.dialogRef.close(this.createForm.value);
    }
}