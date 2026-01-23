import { CommonModule } from "@angular/common";
import { Component, inject, model, ViewEncapsulation } from "@angular/core";
import { MaterialModule } from "../../../shared/modules/material/material.module";
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogRef, MatDialogTitle } from "@angular/material/dialog";
import { IAssignWorkedDayOff } from "./assign-worked-day-off.interface";
import dayjs from "dayjs";

@Component({
    selector: 'app-assign-worked-day-off',
    imports: [
        CommonModule,
        MaterialModule,
        MatDialogContent,
        MatDialogActions,
        MatDialogClose,
        MatDialogTitle
    ],
    templateUrl: './assign-worked-day-off.component.html',
    styleUrl: './assign-worked-day-off.component.scss',
    encapsulation: ViewEncapsulation.None
})
export class AssignWorkedDayOffComponent {
    private readonly dialogRef = inject(MatDialogRef<AssignWorkedDayOffComponent>);
    readonly data = inject<IAssignWorkedDayOff>(MAT_DIALOG_DATA);
    readonly workedDayOff = model(this.data);

    public onCancel(): void {
        this.dialogRef.close();
    }

    public get dateFormat(): string {
        return dayjs(this.data.date).format('dddd, DD [de] MMMM [del] YYYY');
    }
}