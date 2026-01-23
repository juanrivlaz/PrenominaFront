import { CommonModule } from "@angular/common";
import { Component, inject, model, ViewEncapsulation } from "@angular/core";
import { MaterialModule } from "../../../shared/modules/material/material.module";
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogContent, MatDialogRef, MatDialogTitle } from "@angular/material/dialog";
import { IAssignDoubleShift } from "./assign-double-shift.interface";
import dayjs from 'dayjs';

@Component({
    selector: 'app-assign-double-shift',
    imports: [
        CommonModule,
        MaterialModule,
        MatDialogContent,
        MatDialogActions,
        MatDialogTitle
    ],
    templateUrl: './assign-double-shift.component.html',
    styleUrl: './assign-double-shift.component.scss',
    encapsulation: ViewEncapsulation.None
})
export class AssignDoubleShiftComponent {
    private readonly dialogRef = inject(MatDialogRef<AssignDoubleShiftComponent>);
    public readonly data = inject<IAssignDoubleShift>(MAT_DIALOG_DATA);
    public readonly doubleShift = model(this.data);

    public onNoClick(): void {
        this.dialogRef.close({
            confirm: false,
        });
    }

    public get dateFormat(): string {
        return dayjs(this.data.date).format('dddd, DD [de] MMMM [del] YYYY');
    }

    public confirm(): void {
        this.dialogRef.close({
            confirm: true,
        });
    }
}