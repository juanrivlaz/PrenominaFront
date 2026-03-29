import { Component, Inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

export interface BatchNotesDialogData {
    title: string;
    message: string;
    confirmText: string;
    confirmColor: string;
    dates?: string[];
    totalMinutes?: number;
}

export interface BatchNotesDialogResult {
    confirmed: boolean;
    notes: string;
}

@Component({
    selector: 'app-overtime-batch-notes-dialog',
    templateUrl: './overtime-batch-notes-dialog.component.html',
    styleUrl: './overtime-batch-notes-dialog.component.scss',
    imports: [
        ReactiveFormsModule,
        MatDialogModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
    ],
})
export class OvertimeBatchNotesDialogComponent {
    public notesControl = new FormControl('');

    constructor(
        public dialogRef: MatDialogRef<OvertimeBatchNotesDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: BatchNotesDialogData
    ) {}

    formatMinutes(minutes: number): string {
        const hrs = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hrs} hrs ${mins.toString().padStart(2, '0')} min`;
    }

    confirm(): void {
        this.dialogRef.close({ confirmed: true, notes: this.notesControl.value || '' } as BatchNotesDialogResult);
    }
}
