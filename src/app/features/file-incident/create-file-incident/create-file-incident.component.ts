import { CommonModule } from "@angular/common";
import { Component, inject, signal, ViewEncapsulation, WritableSignal } from "@angular/core";
import { AbstractControl, FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatDialogActions, MatDialogClose, MatDialogContent, MatDialogRef, MatDialogTitle } from "@angular/material/dialog";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatSelectModule } from "@angular/material/select";
import { MaterialModule } from "@shared/modules/material/material.module";
import { FileIncidentService } from "../file-incident.service";
import { MatSnackBar } from "@angular/material/snack-bar";
import { MatDividerModule } from "@angular/material/divider";

@Component({
    selector: 'app-create-file-incident',
    imports: [
        CommonModule,
        MaterialModule,
        MatDialogContent,
        MatDialogActions,
        MatDialogTitle,
        ReactiveFormsModule,
        MatSelectModule,
        MatProgressSpinnerModule,
        MatDividerModule
    ],
    providers: [FileIncidentService],
    templateUrl: './create-file-incident.component.html',
    styleUrl: './create-file-incident.component.scss',
    encapsulation: ViewEncapsulation.None
})
export class CreateFileIncidentComponent {
    private readonly _snackBar = inject(MatSnackBar);
    private readonly dialogRef = inject(MatDialogRef<CreateFileIncidentComponent>);
    public createForm: FormGroup;
    public columnForm: FormGroup;
    public loading: WritableSignal<boolean> = signal(false);
    public messageError: WritableSignal<string> = signal('');

    public constructor(private readonly service: FileIncidentService) {
        this.createForm = new FormGroup({
            name: new FormControl('', { validators: [Validators.required] }),
            columns: new FormArray([]),
        });

        this.columnForm = new FormGroup({
            label: new FormControl(''),
            value: new FormControl(''),
            fixedValue: new FormControl('')
        });
    }

    public get columns(): FormArray {
        return this.createForm.get('columns') as FormArray;
    }

    public addColumn(): void {
        this.messageError.set('')
        const { label, value, fixedValue } = this.columnForm.value;

        if (!label) {
            this.messageError.set('El nombre es requerido');

            return;
        } else if (value && fixedValue) {
            this.messageError.set('No puedes agregar dos valores');

            return;
        }

        this.columns.push(new FormGroup({
            label: new FormControl(label),
            value: new FormControl(value),
            fixedValue: new FormControl(fixedValue)
        }));

        this.columnForm.reset();
    }

    public removeColumn(index: number): void {
        this.columns.removeAt(index);
    }

    public getFieldControl(key: string): AbstractControl | null {
        return this.createForm.get(key);
    }

    public getColumnFielControl(key: string): AbstractControl | null {
        return this.columnForm.get(key);
    }
}