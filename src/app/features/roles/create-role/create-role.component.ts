import { CommonModule } from "@angular/common";
import { Component, inject, signal, ViewEncapsulation, WritableSignal } from "@angular/core";
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatDialogActions, MatDialogClose, MatDialogContent, MatDialogRef, MatDialogTitle } from "@angular/material/dialog";
import { MatSelectModule } from "@angular/material/select";
import { ItemsNavigations } from "@core/models/constants/items-navigations";
import { MaterialModule } from "@shared/modules/material/material.module";
import { RolesService } from "../roles.service";
import { finalize } from "rxjs";
import { MatSnackBar } from "@angular/material/snack-bar";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { CreateUserComponent } from "../../users/create-user/create-user.component";

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
    private readonly dialogRef = inject(MatDialogRef<CreateUserComponent>);
    public createForm: FormGroup;
    public listSections: Array<{ code: string, label: string}>;
    public loading: WritableSignal<boolean> = signal(false);

    public constructor(private readonly service: RolesService) {
        this.createForm = new FormGroup({
            label: new FormControl('', { validators: [Validators.required, Validators.minLength(5)] }),
            sections: new FormControl('', [Validators.required]),
            canClosePayrollPeriod: new FormControl(false),
        });

        this.listSections = ItemsNavigations.map((item) => ({ code: item.id, label: item.title }));
    }

    public getFieldControl(key: string): AbstractControl | null {
        return this.createForm.get(key);
    }

    public get hasTasistencia(): boolean {
        return this.createForm.value.sections.includes('tasistencia');
    }

    public submit(): void {
        const { sections, label, canClosePayrollPeriod } = this.createForm.value;

        const mapSections = this.listSections.filter((item) => sections.includes(item.code));
        this.loading.set(true);
        this.service.create({
            label,
            sections: mapSections,
            canClosePayrollPeriod: this.hasTasistencia ? canClosePayrollPeriod : false
        }).pipe(finalize(() => {
            this.loading.set(false);
        })).subscribe({
            next: (response) => {
                this._snackBar.open('El rol se agrego correctamente', '✅', {
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