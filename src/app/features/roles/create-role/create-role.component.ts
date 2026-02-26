import { CommonModule } from "@angular/common";
import { Component, inject, signal, ViewEncapsulation, WritableSignal } from "@angular/core";
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogRef, MatDialogTitle } from "@angular/material/dialog";
import { MatSelectModule } from "@angular/material/select";
import { ItemsNavigations } from "@core/models/constants/items-navigations";
import { MaterialModule } from "@shared/modules/material/material.module";
import { RolesService } from "../roles.service";
import { finalize } from "rxjs";
import { MatSnackBar } from "@angular/material/snack-bar";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { ICreateRole } from "./create-rol.interface";

@Component({
    selector: 'app-create-role',
    imports: [
        CommonModule,
        MaterialModule,
        MatDialogContent,
        MatDialogActions,
        MatDialogClose,
        MatDialogTitle,
        ReactiveFormsModule,
        MatSelectModule,
        MatProgressSpinnerModule
    ],
    providers: [RolesService],
    templateUrl: './create-role.component.html',
    styleUrl: './create-role.component.scss',
    encapsulation: ViewEncapsulation.None
})
export class CreateRoleComponent {
    private readonly _snackBar = inject(MatSnackBar);
    private readonly dialogRef = inject(MatDialogRef<CreateRoleComponent, boolean | undefined>);
    public readonly data = inject<ICreateRole>(MAT_DIALOG_DATA);
    public createForm: FormGroup;
    public listSections: Array<{ code: string, label: string}>;
    public loading: WritableSignal<boolean> = signal(false);
    public isEditMode: boolean = this.data.id ? true : false;

    public constructor(private readonly service: RolesService) {
        this.createForm = new FormGroup({
            label: new FormControl(this.data?.label || '', { validators: [Validators.required, Validators.minLength(5)] }),
            sections: new FormControl(this.data?.sections?.map((section) => section.sectionsCode) || [], [Validators.required]),
            canClosePayrollPeriod: new FormControl(false),
            canModifyCheckins: new FormControl(false),
            canManagePeriods: new FormControl(false)
        });

        this.listSections = ItemsNavigations.map((item) => ({ code: item.id, label: item.title }));
        const sectionHasTasistencia = this.data.sections.find((section) => section.sectionsCode === 'tasistencia');
        const sectionHasPeriod = this.data.sections.find((section) => section.sectionsCode === 'period');

        if (sectionHasTasistencia) {
            this.createForm.get('canClosePayrollPeriod')?.setValue(sectionHasTasistencia.permissions['CanClosePayrollPeriod'] ?? false);
            this.createForm.get('canModifyCheckins')?.setValue(sectionHasTasistencia.permissions['CanModifyCheckins'] ?? false);
        }

        if (sectionHasPeriod) {
            this.createForm.get('canManagePeriods')?.setValue(sectionHasPeriod.permissions['CanManagePeriods'] ?? false);
        }
    }

    public getFieldControl(key: string): AbstractControl | null {
        return this.createForm.get(key);
    }

    public get hasTasistencia(): boolean {
        return this.createForm.value.sections.includes('tasistencia');
    }

    public get hasPeriods(): boolean {
        return this.createForm.value.sections.includes('period');
    }

    public submit(): void {
        const { sections, label, canClosePayrollPeriod } = this.createForm.value;

        const mapSections = this.listSections.filter((item) => sections.includes(item.code));
        this.loading.set(true);
        var form = {
            label,
            sections: mapSections,
            canClosePayrollPeriod: this.hasTasistencia ? canClosePayrollPeriod : false,
            canModifyCheckins: this.hasTasistencia ? this.createForm.value.canModifyCheckins : false,
            canManagePeriods: this.hasPeriods ? this.createForm.value.canManagePeriods : false,
        };

        var execute = this.isEditMode ? this.service.update(this.data.id!, form) : this.service.create(form);

        execute.pipe(finalize(() => {
            this.loading.set(false);
        })).subscribe({
            next: (response) => {
                this._snackBar.open(this.isEditMode ? 'El rol se actualizó correctamente' : 'El rol se agregó correctamente', '✅', {
                    horizontalPosition: 'center',
                    verticalPosition: 'top',
                    panelClass: 'alert-success',
                    duration: 3500
                });

                this.dialogRef.close(response);
            },
            error: (err) => {
                const message = err.error?.message || 'Ocurrió un error, por favor intentalo más tarde';

                this._snackBar.open(message, undefined, {
                  horizontalPosition: 'center',
                  verticalPosition: 'top',
                  panelClass: 'alert-error',
                  duration: 3500
                });
            }
        })
    }
}