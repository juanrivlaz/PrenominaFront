import { CommonModule } from "@angular/common";
import { Component, inject, ViewEncapsulation } from "@angular/core";
import { MaterialModule } from "@shared/modules/material/material.module";
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { IRejectTimeOff } from "./reject-time-off.interface";
import { DialogModule } from "@shared/modules/material/dialog.module";
import dayjs from "dayjs";

@Component({
    selector: 'app-reject-time-off',
    imports: [
        CommonModule,
        MaterialModule,
        ReactiveFormsModule,
        DialogModule,
    ],
    templateUrl: './reject-time-off.component.html',
    styleUrl: './reject-time-off.component.scss',
    encapsulation: ViewEncapsulation.None
})
export class RejectTimeOffComponent {
    private readonly dialogRef = inject(MatDialogRef<RejectTimeOffComponent>);
    readonly data = inject<IRejectTimeOff>(MAT_DIALOG_DATA);

    public rejectForm = new FormGroup({
        comment: new FormControl('', { validators: [Validators.required] }),
    });

    public get isGroup(): boolean {
        return this.data.groupDates.length > 1;
    }

    public get datesFormatted(): Array<string> {
        return this.data.groupDates.map(d => dayjs(d).format('dddd, DD [de] MMMM [del] YYYY'));
    }

    public onCancel(): void {
        this.dialogRef.close();
    }

    public submit(): void {
        this.dialogRef.close(this.rejectForm.value);
    }
}
