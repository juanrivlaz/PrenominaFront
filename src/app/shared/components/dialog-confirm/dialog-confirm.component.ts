import { CommonModule } from "@angular/common";
import { Component, inject, ViewEncapsulation } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogContent, MatDialogRef, MatDialogTitle } from "@angular/material/dialog";
import { MaterialModule } from "@shared/modules/material/material.module";
import { IDialogConfirm } from "./dialog-confirm.interface";

@Component({
    selector: 'app-dialog-confirm',
    imports: [
        CommonModule,
        MaterialModule,
        MatDialogContent,
        MatDialogActions,
        MatDialogTitle
    ],
    templateUrl: './dialog-confirm.component.html',
    styleUrl: './dialog-confirm.component.scss',
    encapsulation: ViewEncapsulation.None
})
export class DialogConfirmComponent {
    public readonly data = inject<IDialogConfirm>(MAT_DIALOG_DATA);
    private readonly dialogRef: MatDialogRef<DialogConfirmComponent, boolean> = inject(MatDialogRef<DialogConfirmComponent, boolean>);

    constructor() {}

    public confirm(): void {
        this.dialogRef.close(true);
    }

    public cancel(): void {
        this.dialogRef.close(false);
    }
}