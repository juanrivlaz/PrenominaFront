import { CommonModule } from "@angular/common";
import { Component, inject, ViewEncapsulation } from "@angular/core";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogRef, MatDialogTitle } from "@angular/material/dialog";
import { MaterialModule } from "@shared/modules/material/material.module";
import { IConfirmAction, IConfirmActionResult } from "./confirm-action.interface";

@Component({
    selector: 'app-confirm-action',
    imports: [
        CommonModule,
        MaterialModule,
        ReactiveFormsModule,
        MatDialogContent,
        MatDialogActions,
        MatDialogClose,
        MatDialogTitle
    ],
    templateUrl: './confirm-action.component.html',
    styleUrl: './confirm-action.component.scss',
    encapsulation: ViewEncapsulation.None
})
export class ConfirmActionComponent {
    private readonly dialogRef = inject(MatDialogRef<ConfirmActionComponent, IConfirmActionResult>);
    public readonly data = inject<IConfirmAction>(MAT_DIALOG_DATA);

    /** Solo se pide motivo cuando la acción es un rechazo. */
    public readonly isReject = this.data.type === 'Rechazar';
    public readonly comment = new FormControl('', { nonNullable: true });

    public confirm(): void {
        this.dialogRef.close({ comment: this.comment.value.trim() });
    }
}