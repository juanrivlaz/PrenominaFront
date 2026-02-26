import { CommonModule } from "@angular/common";
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogContent, MatDialogRef, MatDialogTitle } from "@angular/material/dialog";
import { Component, inject, model, signal, ViewEncapsulation, WritableSignal } from "@angular/core";
import { MaterialModule } from "../../../shared/modules/material/material.module";
import { IAddIncidentCode } from "./add-incident-code.interface";
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatSelectModule } from "@angular/material/select";
import { IncidentCodesManagerService } from "../incident-codes-manager.service";
import { MatSnackBar } from "@angular/material/snack-bar";
import { MatExpansionModule } from "@angular/material/expansion";
import { finalize } from "rxjs";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";

@Component({
    selector: 'app-add-incident-code',
    imports: [
        CommonModule,
        MaterialModule,
        ReactiveFormsModule,
        MatDialogContent,
        MatDialogActions,
        MatDialogTitle,
        MatSelectModule,
        MatExpansionModule,
        MatProgressSpinnerModule
    ],
    providers: [IncidentCodesManagerService],
    templateUrl: './add-incident-code.component.html',
    styleUrl: './add-incident-code.component.scss',
    encapsulation: ViewEncapsulation.None
})
export class AddIncidentCodeComponent {
    private readonly _snackBar = inject(MatSnackBar);
    private readonly dialogRef = inject(MatDialogRef<AddIncidentCodeComponent>);
    public readonly data = inject<IAddIncidentCode>(MAT_DIALOG_DATA);
    public readonly incidentCode = model(this.data.name);
    public incidentForm: FormGroup;
    public showMetadataAmount: WritableSignal<boolean> = signal(false);
    public isEditMode: boolean = !!this.data.item;
    public loading = false;

    constructor(private readonly service: IncidentCodesManagerService) {
        this.incidentForm = new FormGroup({
            code: new FormControl({
                value: this.data.item?.code ?? '',
                disabled: this.isEditMode
            }, {
                validators: [Validators.required],
            }),
            externalCode: new FormControl(this.data.item?.externalCode ?? '', {
                validators: [Validators.required]
            }),
            label: new FormControl(this.data.item?.label ?? '', {
                validators: [Validators.required, Validators.minLength(2)]
            }),
            notes: new FormControl(this.data.item?.notes ?? ''),
            applyMode: new FormControl(this.data.item?.applyMode ?? '', {
                validators: [Validators.required]
            }),
            requiredApproval: new FormControl<boolean>( this.data.item?.requiredApproval ?? false),
            withOperation: new FormControl<boolean>(this.data.item?.withOperation ?? false),
            isAdditional: new FormControl<boolean>(this.data.item?.isAdditional ?? true),
            metadata: new FormGroup({
                amount: new FormControl(this.data.item?.incidentCodeMetadata?.customValue ?? this.data.item?.incidentCodeMetadata?.amount ?? null),
                mathOperation: new FormControl(this.data.item?.incidentCodeMetadata?.mathOperation ?? ''),
                columnForOperation: new FormControl(this.data.item?.incidentCodeMetadata?.columnForOperation ?? ''),
            }),
            incidentApprovers: new FormControl(this.data.item?.incidentApprovers?.map(approver => approver.userId) ?? ''),
            restrictedWithRoles: new FormControl<boolean>(this.data.item?.restrictedWithRoles ?? false),
            allowedRoles: new FormControl<Array<string>>(this.data.item?.incidentCodeAllowedRoles?.map(role => role.roleId) ?? []),
        });

        this.incidentForm.get('withOperation')?.valueChanges.subscribe((value) => {
            if (value) {
                this.incidentForm.get('metadata')?.get('amount')?.setValidators([Validators.required, Validators.min(1)]);
                this.incidentForm.get('metadata')?.get('mathOperation')?.setValidators([Validators.required]);
                this.incidentForm.get('metadata')?.get('columnForOperation')?.setValidators([Validators.required]);
                this.incidentForm.get('metadata')?.get('applyMode')?.setValidators([Validators.required]);
            } else {
                this.incidentForm.get('metadata')?.get('amount')?.clearValidators();
                this.incidentForm.get('metadata')?.get('mathOperation')?.clearValidators();
                this.incidentForm.get('metadata')?.get('columnForOperation')?.clearValidators();
                this.incidentForm.get('metadata')?.get('applyMode')?.clearValidators();
            }
        });

        this.incidentForm.get('requiredApproval')?.valueChanges.subscribe((value) => {
            if (value) {
                this.incidentForm.get('incidentApprovers')?.setValidators([Validators.required, Validators.minLength(1)]);
            } else {
                this.incidentForm.get('incidentApprovers')?.clearValidators();
            }
        });

        this.incidentForm.get('restrictedWithRoles')?.valueChanges.subscribe((value) => {
            if (value) {
                this.incidentForm.get('allowedRoles')?.setValidators([Validators.required, Validators.minLength(1)]);
            } else {
                this.incidentForm.get('allowedRoles')?.clearValidators();
            }
        });

        this.incidentForm.get('metadata')?.get('columnForOperation')?.valueChanges.subscribe((value) => {
            if (value === 1) {
                this.incidentForm.get('metadata')?.get('amount')?.setValidators([Validators.required, Validators.min(1)]);
                this.showMetadataAmount.set(true);
            } else {
                this.incidentForm.get('metadata')?.get('amount')?.clearValidators();
                this.showMetadataAmount.set(false);
            }
        });

        if (this.data.item?.incidentCodeMetadata?.columnForOperation === 1) {
            this.showMetadataAmount.set(true);
        }
    }

    public onCancel(): void {
        this.dialogRef.close();
    }

    public get codeControl(): AbstractControl {
        return this.incidentForm.get('code')!;
    }

    public get externalCodeControl(): AbstractControl {
        return this.incidentForm.get('externalCode')!;
    }

    public get labelControl(): AbstractControl {
        return this.incidentForm.get('label')!;
    }

    public get notes(): AbstractControl {
        return this.incidentForm.get('notes')!;
    }

    public get valueWithOperation(): boolean {
        return this.incidentForm.get('withOperation')?.value || false;
    }

    public get valueRequiredApproval(): boolean {
        return this.incidentForm.get('requiredApproval')?.value || false;
    }

    public get valueRestricted(): boolean {
        return this.incidentForm.get('restrictedWithRoles')?.value || false;
    }

    public setValueWithOperation(value: boolean): void {
        this.incidentForm.get('withOperation')?.setValue(value);
    }

    public setValueRequiredApproval(value: boolean): void {
        this.incidentForm.get('requiredApproval')?.setValue(value);
    }

    public setValueRestricted(value: boolean): void {
        this.incidentForm.get('restrictedWithRoles')?.setValue(value);
    }

    public getMetadataField(field: string): AbstractControl | null {
        return this.incidentForm.get('metadata')?.get(field) || null;
    }

    public submit(): void {
        this.incidentForm.markAllAsTouched();
        const form = {
            ...this.incidentForm.value,
            incidentApprovers: this.incidentForm.value.incidentApprovers || [],
        };
        const { withOperation } = form;

        if (!withOperation) {
            delete form.metadata;
        }

        let fetchService = this.service.store(form);

        if (this.isEditMode && this.data.item) {
            fetchService = this.service.update(this.data.item.code, {
                ...form,
                code: this.data.item.code
            });
        }

        this.loading = true;
        
        fetchService.pipe(finalize(() => this.loading = false)).subscribe({
            next: (response) => {
                this.dialogRef.close(response);
                this._snackBar.open(`La incidencia ha sido ${this.isEditMode ? 'actualizada' : 'creada'}`, '✅', {
                    horizontalPosition: 'center',
                    verticalPosition: 'top',
                    panelClass: 'alert-success',
                    duration: 3000
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
            }
        });
    }
}