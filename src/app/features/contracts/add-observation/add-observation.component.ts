import { CommonModule } from "@angular/common";
import { Component, inject, model, ViewEncapsulation } from "@angular/core";
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogContent, MatDialogRef, MatDialogTitle } from "@angular/material/dialog";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatSnackBar } from "@angular/material/snack-bar";
import { MaterialModule } from "@shared/modules/material/material.module";
import { IAddObservation } from "./add-observation.interface";
import { finalize } from "rxjs";
import { Contract } from "@core/models/contract";
import { MatSelectModule } from "@angular/material/select";

@Component({
    selector: 'app-add-observation',
    imports: [
        CommonModule,
        MaterialModule,
        ReactiveFormsModule,
        MatDialogContent,
        MatDialogActions,
        MatDialogTitle,
        MatSelectModule,
        MatProgressSpinnerModule
    ],
    templateUrl: './add-observation.component.html',
    styleUrl: './add-observation.component.scss',
    encapsulation: ViewEncapsulation.None
})
export class AddObservationComponent {
    private readonly _snackBar = inject(MatSnackBar);
    private readonly dialogRef: MatDialogRef<AddObservationComponent, { contract: Contract }> = inject(MatDialogRef<AddObservationComponent, { contract: Contract }>);
    public readonly data = inject<IAddObservation>(MAT_DIALOG_DATA);
    public createForm: FormGroup;
    public loading = model<boolean>(false);

    constructor() {
        this.createForm = new FormGroup({
            folioContract: new FormControl(this.data.folioContract, {
                validators: [Validators.required],
            }),
            employeeCode: new FormControl(this.data.employeeCode, {
                validators: [Validators.required],
            }),
            companyId: new FormControl(this.data.companyId, {
                validators: [Validators.required],
            }),
            generateContract: new FormControl(this.data.generateContract, {
                validators: [Validators.required],
            }),
            observation: new FormControl(this.data.observation),
            contractDays: new FormControl(this.data.contractDays),
        });
    }

    public onCancel(): void {
        this.dialogRef.close();
    }

    public submit(): void {
        this.loading.set(true);
        this.dialogRef.disableClose = true;
        const { value } = this.createForm;

        this.data.service.setApplyNewContract(
            value.employeeCode,
            value.companyId,
            value.folioContract,
            value.generateContract,
            value.observation,
            value.contractDays
        ).pipe((finalize(() => {
            this.loading.set(false);
        }))).subscribe({
            next: (response) => {
                this._snackBar.open('Registro actualizado', '✅', {
                  horizontalPosition: 'center',
                  verticalPosition: 'top',
                  panelClass: 'alert-success',
                  duration: 1500
                });

                this.dialogRef.close({
                    contract: response,
                });
            },
            error: (err) => {
                const message = err.error?.message || 'Ocurrió un error, por favor intentalo más tarde';

                this._snackBar.open(message, '❌', {
                  horizontalPosition: 'center',
                  verticalPosition: 'top',
                  panelClass: 'alert-error',
                  duration: 3000
                });
            },
        });
    }
}