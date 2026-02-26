import { CommonModule } from "@angular/common";
import { Component, inject, ViewEncapsulation } from "@angular/core";
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { MatSelectModule } from "@angular/material/select";
import { AvatarComponent } from "@shared/components/avatar/avatar.component";
import { DialogModule } from "@shared/modules/material/dialog.module";
import { MaterialModule } from "@shared/modules/material/material.module";
import { IAssignSpecialIncident } from "./assign-special-incident.interface";
import { IIncidentCode } from "@core/models/incident-code.interface";
import { ApplyMode } from "@core/models/enum/apply-mode";

@Component({
    selector: 'app-assign-special-incident',
    imports: [
        CommonModule,
        MaterialModule,
        ReactiveFormsModule,
        MatSelectModule,
        DialogModule,
        AvatarComponent,
    ],
    templateUrl: './assign-special-incident.component.html',
    styleUrl: './assign-special-incident.component.scss',
    encapsulation: ViewEncapsulation.None
})
export class AssignSpecialIncidentComponent {
    private readonly dialogRef = inject(MatDialogRef<AssignSpecialIncidentComponent>);
    public readonly data = inject<IAssignSpecialIncident>(MAT_DIALOG_DATA);
    public formGroup: FormGroup;

    constructor() {
        this.formGroup = new FormGroup({
            incidentCode: new FormControl('', {
                validators: [Validators.required],
            }),
            date: new FormControl('', [Validators.required]),
            customValue: new FormControl('', [Validators.min(1)])
        });

        this.formGroup.get('incidentCode')?.valueChanges.subscribe((value) => {
            const find = this.data.incidentCodes.find((item) => item.code === value);

            if (find?.withOperation) {
                this.formGroup.get('customValue')?.setValidators([Validators.required, Validators.min(1)]);
            } else {
                this.formGroup.get('customValue')?.setValidators([Validators.min(1)]);
            }

            this.formGroup.get('customValue')?.updateValueAndValidity();
        });
    }

    public getFieldControl(name: string): AbstractControl | null {
        return this.formGroup.get(name);
    }

    public submit(): void {
        this.dialogRef.close(this.formGroup.value);   
    }

    public onCancel(): void {
        this.dialogRef.close();
    }

    public get incidentCode(): IIncidentCode | null {
        const actIncidentCode = this.formGroup.get('incidentCode')?.value;
        const find = this.data.incidentCodes.find((item) => item.code === actIncidentCode);

        return find || null;
    }

    public get isPeriod(): boolean {
        if (this.incidentCode === null) {
            return true;
        }

        return this.incidentCode?.applyMode === ApplyMode.Period;
    }
    
    public get withOperation(): boolean {
        return this.incidentCode?.withOperation || false;
    }
}