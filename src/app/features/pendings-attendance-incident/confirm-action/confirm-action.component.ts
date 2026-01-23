import { CommonModule } from "@angular/common";
import { Component, inject, ViewEncapsulation } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogRef, MatDialogTitle } from "@angular/material/dialog";
import { MaterialModule } from "@shared/modules/material/material.module";
import { IConfirmAction } from "./confirm-action.interface";
import dayjs from 'dayjs';

@Component({
    selector: 'app-confirm-action',
    imports: [
        CommonModule,
        MaterialModule,
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
    private readonly dialogRef = inject(MatDialogRef<ConfirmActionComponent>);
    public readonly data = inject<IConfirmAction>(MAT_DIALOG_DATA);

    public confirm(): void {

    }

    public get dateFormat(): string {
        return dayjs(this.data.date).format('dddd, DD [de] MMMM [del] YYYY');
    }
}