import { CommonModule } from "@angular/common";
import { Component, inject, model, ViewEncapsulation } from "@angular/core";
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogContent, MatDialogRef, MatDialogTitle } from "@angular/material/dialog";
import { MatSelectModule } from "@angular/material/select";
import { RoleCode } from "@core/models/enum/role-code";
import { TypeTenant } from "@core/models/enum/type-tenant";
import { Tenant } from "@core/models/tenant";
import { ValidateEqualPassword } from "@core/validators/validate-equal-password.validator";
import { MaterialModule } from "@shared/modules/material/material.module";
import { ICreateUser } from "./create-user.interface";
import { finalize } from "rxjs";
import { MatSnackBar } from "@angular/material/snack-bar";
import { IUser } from "@core/models/user.interface";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { IUserWithDetails } from "@core/models/user-with-details.interface";

@Component({
    selector: 'app-create-user',
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
    templateUrl: './create-user.component.html',
    styleUrl: './create-user.component.scss',
    encapsulation: ViewEncapsulation.None
})
export class CreateUserComponent {
    private readonly _snackBar = inject(MatSnackBar);
    private readonly dialogRef: MatDialogRef<CreateUserComponent, { user: IUserWithDetails }> = inject(MatDialogRef<CreateUserComponent, { user: IUser }>);
    public readonly data = inject<ICreateUser>(MAT_DIALOG_DATA);
    public createForm: FormGroup;
    public tenants: Tenant[] = [];
    public loading = model<boolean>(false);
    public isEditMode = !!this.data.editData;

    constructor() {
        this.createForm = new FormGroup({
            name: new FormControl( this.data.editData?.name || '', {
                validators: [Validators.required]
            }),
            email: new FormControl(this.data.editData?.email || '', {
                validators: [Validators.required, Validators.email]
            }),
            roleId: new FormControl(this.data.editData?.role?.id || '', {
                validators: [Validators.required]
            }),
            password: new FormControl('', {
                validators: this.isEditMode ? [Validators.minLength(6)] : [Validators.required, Validators.minLength(6)]
            }),
            confirmPassword: new FormControl('', {
                validators: this.isEditMode ? [Validators.minLength(6)] : [Validators.required, Validators.minLength(6)]
            }),
            companies: new FormControl('', {
                validators: [Validators.required]
            }),
            tenants: new FormControl('', {
                validators: [Validators.required]
            }),
        }, {
            validators: [ValidateEqualPassword]
        });

        this.createForm.get('companies')?.valueChanges.subscribe((item) => {
            this.setTenants(item);
        });

        this.createForm.get('roleId')?.valueChanges.subscribe((item) => {
            if (item) {
                const find = this.data.roles.find((r) => r.id === item);
                if (find && find.code === RoleCode.Sudo) {
                    this.createForm.get('companies')?.setValidators([]);
                    this.createForm.get('tenants')?.setValidators([]);
                } else {
                    this.createForm.get('companies')?.setValidators([Validators.required]);
                    this.createForm.get('tenants')?.setValidators([Validators.required]);
                }

                this.createForm.get('companies')?.updateValueAndValidity();
                this.createForm.get('tenants')?.updateValueAndValidity();
            }
        });

        if (this.data.editData) {
            this.createForm.get('companies')?.setValue(this.data.editData.userCompanies.map((c) => c.companyId));

            if (this.data.typeTenant === TypeTenant.Department) {
                const departments = this.data.editData.userCompanies.flatMap((c) => c.userDepartments?.map(
                    (d) => {
                        const department = this.data.centers.find((center) => center.id.trim() === d.departmentCode.trim())!;
                        const company = this.data.companies.find((company) => company.id == c.companyId);

                        return new Tenant(parseInt(department.id, 10), department.departmentName, company?.name, company?.id)
                    }
                ) || []);

                this.createForm.get('tenants')?.setValue(departments);
            } else {
                this.createForm.get('tenants')?.setValue(this.data.editData.userCompanies.flatMap((c) => c.userSupervisors?.map(
                    (s) => {
                        const supervisor = this.data.supervisors.find((superv) => superv.id === s.supervisorId)!;
                        const company = this.data.companies.find((company) => company.id == c.companyId);

                        return new Tenant(s.supervisorId, supervisor.name, company?.name, company?.id);
                    }
                ) || []));
            }
        }
    }

    public getFieldControl(key: string): AbstractControl | null {
        return this.createForm.get(key);
    }

    public onCancel(): void {
        this.dialogRef.close();
    }

    public submit(): void {
        this.loading.set(true);
        this.dialogRef.disableClose = true;
        const { value } = this.createForm;
        const groupCompanies = Object.values(value.tenants.reduce((acc: { [x: string]: { tenantIds: any[]; id: number }; }, item: { companyId: number; id: any; }) => {
            if (!acc[item.companyId]) {
                acc[item.companyId] = {
                    id: item.companyId,
                    tenantIds: []
                };
            }

            acc[item.companyId].tenantIds.push(item.id);

            return acc;
        }, {}));

        const action$ = this.isEditMode
            ? this.data.service.update(this.data.editData!.id, {
                companies: groupCompanies as Array<any>,
                email: value.email,
                name: value.name,
                password: value.password,
                roleId: value.roleId
            })
            : this.data.service.create({
                companies: groupCompanies as Array<any>,
                email: value.email,
                name: value.name,
                password: value.password,
                roleId: value.roleId
            })

        action$.pipe(finalize(() => {
            this.loading.set(false);
        })).subscribe({
            next: (response) => {
                this._snackBar.open(`Usuario ${this.isEditMode ? 'actualizado' : 'agregado'} correctamente`, '✅', {
                  horizontalPosition: 'center',
                  verticalPosition: 'top',
                  panelClass: 'alert-success',
                  duration: 3000
                });

                this.dialogRef.close({
                    user: response,
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

    public setTenants(companyIds: Array<number>): void {
        if (this.data.typeTenant === TypeTenant.Department) {
            this.tenants = this.data.centers.filter((item) => companyIds.includes(item.company)).map(
                (item) => {
                    const company = this.data.companies.find((c) => c.id == item.company);
                    return new Tenant(parseInt(item.id, 10), item.departmentName, company?.name, company?.id);
                }
            );
        } else {
            this.tenants = this.data.supervisors.filter((item) => companyIds.includes(item.company)).map(
                (item) => {
                    const company = this.data.companies.find((c) => c.id == item.company);
                    return new Tenant(item.id, item.name, company?.name, company?.id);
                }
            );
        }
    }

    public compareTenant = (a: Tenant, b: Tenant) => a && b && a.id === b.id;
}