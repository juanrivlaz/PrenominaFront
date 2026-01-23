import { CommonModule } from "@angular/common";
import { Component, inject, signal, ViewEncapsulation, WritableSignal } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogContent, MatDialogRef, MatDialogTitle } from "@angular/material/dialog";
import { MaterialModule } from "@shared/modules/material/material.module";
import { IConfirmClosePeriod } from "./confirm-close-period.interface";
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { AuthService } from "@core/services/auth/auth.service";
import { TypeTenant } from "@core/models/enum/type-tenant";
import { Company } from "@core/models/company";
import { Center } from "@core/models/center";
import { Supervisor } from "@core/models/supervisor";
import { MatSelectModule } from "@angular/material/select";

@Component({
    selector: 'app-confirm-close-period',
    imports: [
        CommonModule,
        MaterialModule,
        MatDialogContent,
        MatDialogActions,
        MatDialogTitle,
        ReactiveFormsModule,
        MatSelectModule
    ],
    templateUrl: './confirm-close-period.component.html',
    styleUrl: './confirm-close-period.component.scss',
    encapsulation: ViewEncapsulation.None
})
export class ConfirmClosePeriodComponent {
    private readonly dialogRef = inject(MatDialogRef<ConfirmClosePeriodComponent>);
    public readonly data = inject<IConfirmClosePeriod>(MAT_DIALOG_DATA);
    public formGroup: FormGroup;
    private _tenants: Array<{ id: string, label: string, company: number }> = [];
    public companies: WritableSignal<Array<Company>> = signal([]);
    public centers: WritableSignal<Array<Center>> = signal([]);
    public supervisors: WritableSignal<Array<Supervisor>> = signal([]);
    public activeCompany: WritableSignal<number> = signal(0);

    constructor(private readonly authService: AuthService) {
        this.formGroup = new FormGroup({
            tenant: new FormControl(this.data.tenantId || '', {
                validators: [Validators.required]
            })
        });

        this.authService.companies.subscribe((result) => {
            this.companies.set(result);
        });
        this.authService.centers.subscribe((result) => {
            this.centers.set(result);
        });
        this.authService.supervisors.subscribe((result) => {
            this.supervisors.set(result);
        });
        this.authService.activeCompany.subscribe((result) => {
            this.activeCompany.set(result);
        });

        this.authService.typeTenant.subscribe((result) => {
            this._tenants = result === TypeTenant.Department ? this.centers().map((c) => ({
                id: c.id.trim().replace(/\s+/g, '') || '0',
                label: c.departmentName || '-',
                company: c.company,
            })) : this.supervisors().map((s) => ({
                id: s.id.toString(),
                label: s.name || '-',
                company: s.company,
            }));

            this._tenants.unshift({
                id: '-999',
                label: 'TODOS',
                company: -999
            });
        });
    }

    public getFieldControl(name: string): AbstractControl | null {
        return this.formGroup.get(name);
    }

    public onNoClick(): void {
        this.dialogRef.close({
            confirm: false,
        });
    }

    public confirm(): void {
        this.dialogRef.close({
            confirm: true,
            tenant: this.formGroup.value.tenant
        });
    }

    public get tenants(): Array<{ id: string, label: string, company: number }> {
        return this._tenants.filter((item) => item.company === this.activeCompany() || item.company === -999);
    }

    public get isClosed(): boolean {
        if (this.data.listPeriodStatus.length === 0) {
            return false;
        }

        return this.data.listPeriodStatus.some(
            (item) => item.typePayroll === this.data.TypePayroll && 
                item.numPeriod === this.data.NumPeriod && 
                (item.tenantId === '-999' || item.tenantId === this.formGroup.value.tenant) &&
                item.companyId === this.activeCompany()
        );
    }
}