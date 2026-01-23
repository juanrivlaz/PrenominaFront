import { Component, signal, ViewEncapsulation, WritableSignal } from "@angular/core";
import { MaterialModule } from "../../modules/material/material.module";
import { MatTooltipModule } from "@angular/material/tooltip";
import { CommonModule } from "@angular/common";
import { MatMenuModule } from "@angular/material/menu";
import { AvatarComponent } from "../avatar/avatar.component";
import { AuthService } from "@core/services/auth/auth.service";
import { Company } from "@core/models/company";
import { TypeTenant } from "@core/models/enum/type-tenant";
import { Center } from "@core/models/center";
import { Supervisor } from "@core/models/supervisor";
import { Router } from '@angular/router';

@Component({
    selector: 'app-toolbar',
    templateUrl: './toolbar.component.html',
    styleUrl: './toolbar.component.scss',
    imports: [
        CommonModule,
        MaterialModule,
        MatMenuModule,
        MatTooltipModule,
        AvatarComponent
    ],
    encapsulation: ViewEncapsulation.None,
})
export class AppToolbar {
    private _tenants: Array<{ id: string, label: string, company: number }> = [];
    public companies: WritableSignal<Array<Company>> = signal([]);
    public centers: WritableSignal<Array<Center>> = signal([]);
    public supervisors: WritableSignal<Array<Supervisor>> = signal([]);
    public activeCompany: WritableSignal<number> = signal(0);
    public activeTenant: string = '0';
    public typeTenant: WritableSignal<number> = signal(TypeTenant.Department);

    constructor(
        private readonly authService: AuthService,
        private readonly router: Router
    ) {
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
        this.authService.activeTenant.subscribe((result) => {
            this.activeTenant = result;
        });

        this.authService.typeTenant.subscribe((result) => {
            this._tenants = result === TypeTenant.Department ? this.centers().map((c) => ({
                id: c.id || '0',
                label: c.departmentName || '-',
                company: c.company,
            })) : this.supervisors().map((s) => ({
                id: s.id.toString(),
                label: s.name || '-',
                company: s.company,
            }));

            if (this.authService.role === 'sudo') {
                this._tenants.unshift({
                    id: '-999',
                    label: 'TODOS',
                    company: -999
                });
            }
        });
    }

    public get company(): string {
        const company = this.companies().find((item) => item.id === this.activeCompany());

        if (company) {
            return `${company?.name || ''} | ${company?.rfc || ''}`;
        }

        return 'Seleccione empresa';
    }

    public get tenant(): string {
        const tenant = this.tenants.find((item) => item.id === this.activeTenant);

        if (tenant) {
            return tenant?.label || '-';
        }
        
        return 'Seleccionar';
    }

    public get tenants(): Array<{ id: string, label: string, company: number }> {
        return this._tenants.filter((item) => item.company === this.activeCompany() || item.company === -999);
    }

    public get userName(): string {
        return this.authService.userName;
    }

    public get role(): string {
        return this.authService.role;
    }

    public selectCompany(id: number): void {
        const firstTenant = this._tenants.filter((item) => item.company === id)[0]?.id;
        this.authService.setActiveCompany(id);

        if (firstTenant) {
            this.selectTenant(firstTenant);
        }
    }

    public selectTenant(id: string): void {
        this.activeTenant = id;
        this.authService.setActiveTenant(id);
    }

    public logOut(): void {
        this.authService.logAuth();
        this.router.navigate(['/auth/login']);
    }
}