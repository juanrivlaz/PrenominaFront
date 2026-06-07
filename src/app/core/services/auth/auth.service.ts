import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { JwtHelperService } from '@auth0/angular-jwt';
import { Center } from "@core/models/center";
import { Company } from "@core/models/company";
import { RoleCode } from "@core/models/enum/role-code";
import { SysKey } from "@core/models/enum/sys-key";
import { TimeZone } from "@core/models/enum/time-zone";
import { TypeTenant } from "@core/models/enum/type-tenant";
import { ILoginResponse } from "@core/models/login-response.interface";
import { ISectionRol } from "@core/models/section-rol.interface";
import { Supervisor } from "@core/models/supervisor";
import { SecureStorageService } from "@core/services/storage/secure-storage.service";
import { BehaviorSubject } from "rxjs";

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    private jwtHelper: JwtHelperService;
    private readonly tokenKey = 'auth-token';

    // Token almacenado SOLO en memoria (nunca en storage)
    private _token?: string;

    public typeTenant: BehaviorSubject<number> = new BehaviorSubject(TypeTenant.Department);
    public year: BehaviorSubject<number> = new BehaviorSubject(0);
    public timeZone: BehaviorSubject<string> = new BehaviorSubject(TimeZone.Bahia_Banderas.toString());
    public activeCompany: BehaviorSubject<number> = new BehaviorSubject(0);
    public activeTenant: BehaviorSubject<string> = new BehaviorSubject('0');
    public payrollPeriod: BehaviorSubject<number> = new BehaviorSubject(0);
    public payrollType: BehaviorSubject<number> = new BehaviorSubject(0);
    public companies: BehaviorSubject<Array<Company>> = new BehaviorSubject<Array<Company>>([]);
    public centers: BehaviorSubject<Array<Center>> = new BehaviorSubject<Array<Center>>([]);
    public supervisors: BehaviorSubject<Array<Supervisor>> = new BehaviorSubject<Array<Supervisor>>([]);
    public sectionsForAccess: BehaviorSubject<Array<ISectionRol>> = new BehaviorSubject<Array<ISectionRol>>([]);

    constructor(
        private readonly httpService: HttpClient,
        private readonly secureStorage: SecureStorageService
    ) {
        this.jwtHelper = new JwtHelperService();
        // Intentar recuperar token de memoria (en caso de que el servicio persista)
        this._token = this.secureStorage.getToken(this.tokenKey) ?? undefined;
        this.setInitDataSystem();
    }

    /**
     * Getter seguro para el token
     */
    public get token(): string | undefined {
        return this._token;
    }

    public get isLoggedIn(): boolean {
        if (!this._token) {
            return false;
        }

        try {
            return !this.jwtHelper.isTokenExpired(this._token);
        } catch {
            return false;
        }
    }

    public hasRole(roles: Array<string>): boolean {
        if (!roles.length) {
            return true;
        }

        return roles.includes(this.role);
    }

    public get role(): string {
        if (!this._token) {
            return '';
        }

        try {
            const decode = this.jwtHelper.decodeToken(this._token);

            return decode?.RoleCode || '';
        } catch {
            return '';
        }
    }

    public get userName(): string {
        if (!this._token) {
            return '';
        }

        try {
            const decode = this.jwtHelper.decodeToken(this._token);
            return decode?.given_name || '';
        } catch {
            return '';
        }
    }

    public login(loginResponse: ILoginResponse, update: boolean = false): void {
        const activeCompanyValue = this.secureStorage.getSession(SysKey.ActiveCompany);
        const activeTenantValue = this.secureStorage.getSession(SysKey.ActiveTenant);

        // Almacenar token SOLO en memoria (más seguro contra XSS)
        this._token = loginResponse.token;
        this.secureStorage.setToken(this.tokenKey, loginResponse.token);

        this.companies.next(loginResponse.userDetails?.companies || []);
        this.centers.next(loginResponse.userDetails?.centers || []);
        this.supervisors.next(loginResponse.userDetails?.supervisors || []);
        this.year.next(loginResponse.year);

        this.setTypeTenant(loginResponse.typeTenant);

        if (update) {
            if (loginResponse.userDetails.companies?.length) {
                const existCompany = loginResponse.userDetails.companies.find(item => item.id === parseInt(activeCompanyValue || '-1', 10));
                this.setActiveCompany(existCompany?.id || loginResponse.userDetails.companies[0].id);
            }

            if (loginResponse.typeTenant === TypeTenant.Department && loginResponse.userDetails.centers?.length) {
                const existTenant = loginResponse.userDetails.centers.find(item => item.id.trim() === activeTenantValue?.trim());
                const firstCenter = existTenant || loginResponse.userDetails.centers[0];

                if (activeTenantValue === "-999" && loginResponse.userDetails.role.code === 'sudo') {
                    this.setActiveTenant('-999');
                } else {
                    this.setActiveTenant(firstCenter.id.trim());
                }
            } else if (loginResponse.typeTenant === TypeTenant.Supervisor && loginResponse.userDetails.supervisors?.length) {
                const existTenant = loginResponse.userDetails.supervisors.find(item => item.id === parseInt(activeTenantValue || '-1', 10));
                const firstSupervisor = existTenant || loginResponse.userDetails.supervisors[0];

                if (activeTenantValue === "-999" && loginResponse.userDetails.role.code === 'sudo') {
                    this.setActiveTenant('-999');
                } else {
                    this.setActiveTenant(firstSupervisor.id.toString());
                }
            }
        }

        if (loginResponse.userDetails.role && loginResponse.userDetails.role.code !== RoleCode.Sudo) {
            this.sectionsForAccess.next(loginResponse.userDetails.role.sections.map((item) => item));
        }
    }

    public logAuth(): void {
        // Limpiar token de memoria
        this._token = undefined;
        this.secureStorage.removeToken(this.tokenKey);
        // Limpiar session storage
        this.secureStorage.clearSession();
    }

    public setTypeTenant(typeTenant: number): void {
        const activeTenantValue = this.secureStorage.getSession(SysKey.ActiveTenant);
        // TypeTenant no es sensible, usar storage normal
        this.secureStorage.setLocal(SysKey.TypeTenant, typeTenant.toString());
        let findFirst: string;
        if (typeTenant === TypeTenant.Department) {
            const existTenant = this.centers.value.find(item => item.id.trim() === activeTenantValue?.trim());
            findFirst = existTenant?.id || this.centers.value?.[0]?.id || '0';
        } else {
            const existTenant = this.supervisors.value.find(item => item.id === parseInt(activeTenantValue || '-1', 10));
            findFirst = (existTenant?.id || this.supervisors.value?.[0]?.id).toString();
        }

        if (this.role === 'sudo' && activeTenantValue === '-999') {
            findFirst = '-999';
        }

        if (findFirst) {
            this.setActiveTenant(findFirst);
        }

        this.typeTenant.next(typeTenant);
    }

    public setActiveCompany(company: number): void {
        this.secureStorage.setSession(SysKey.ActiveCompany, company.toString());
        if (this.activeCompany.value !== company) {
            this.activeCompany.next(company);
        }
    }

    public getActiveTenantName(): string {
        const id = this.activeTenant.value;
        if (id === '-999' || id === '0' || !id) {
            return 'todos';
        }
        if (this.typeTenant.value === TypeTenant.Department) {
            const center = this.centers.value.find((c) => c.id?.trim() === id.trim());
            return center?.departmentName || id;
        }
        const supervisor = this.supervisors.value.find((s) => s.id === parseInt(id, 10));
        return supervisor?.name || id;
    }

    public getActiveCompanyName(): string {
        const id = this.activeCompany.value;
        const company = this.companies.value.find((c) => c.id === id);
        return company?.name || '';
    }

    public setActiveTenant(tenant: string): void {
        this.secureStorage.setSession(SysKey.ActiveTenant, tenant.toString());
        if (this.activeTenant.value !== tenant) {
            this.activeTenant.next(tenant);
        }
    }

    public setPayrollPeriod(period: number): void {
        this.secureStorage.setSession(SysKey.PayrollPeriod, period.toString());
        this.payrollPeriod.next(period);
    }

    public setPayrollType(type: number): void {
        this.secureStorage.setSession(SysKey.PayrollType, type.toString());
        this.payrollType.next(type);
    }

    public setTimeZone(timeZone: TimeZone): void {
        this.secureStorage.setLocal(SysKey.TimeZone, timeZone);
        this.timeZone.next(timeZone);
    }

    public setYear(year: number): void {
        this.secureStorage.setLocal(SysKey.Year, year.toString());
        this.year.next(year);
    }

    public getMe(): void {
        this.httpService.get<ILoginResponse>('/User/me').subscribe({
            next: (response) => {
                // update=true so a default company/tenant is auto-selected when the session has
                // none (it still restores the previous selection when present), avoiding the
                // empty "Seleccione empresa" state on refresh.
                this.login({
                    ...response,
                    token: this._token || '',
                }, true);
            },
            error: () => {
                // Error silencioso - no exponer información en consola
            }
        });
    }

    private setInitDataSystem(): void {
        const typeTenantValue = this.secureStorage.getLocal(SysKey.TypeTenant);
        const timeZoneValue = this.secureStorage.getLocal(SysKey.TimeZone);
        const activeCompanyValue = this.secureStorage.getSession(SysKey.ActiveCompany);
        const activeTenantValue = this.secureStorage.getSession(SysKey.ActiveTenant);
        const payrollPeriodValue = this.secureStorage.getSession(SysKey.PayrollPeriod);
        const payrollTypeValue = this.secureStorage.getSession(SysKey.PayrollType);
        const yearValue = this.secureStorage.getLocal(SysKey.Year);

        if (yearValue) {
            const parseYear = parseInt(yearValue, 10);
            if (!isNaN(parseYear)) {
                this.year.next(parseYear);
            }
        }

        if (typeTenantValue) {
            const parseTypeTenant = parseInt(typeTenantValue, 10);
            if (!isNaN(parseTypeTenant)) {
                this.typeTenant.next(parseTypeTenant);
            }
        }

        if (timeZoneValue) {
            this.timeZone.next(timeZoneValue as TimeZone);
        }

        if (activeCompanyValue) {
            const parseActiveCompany = parseInt(activeCompanyValue, 10);
            if (!isNaN(parseActiveCompany)) {
                this.activeCompany.next(parseActiveCompany);
            }
        }

        if (activeTenantValue) {
            this.activeTenant.next(activeTenantValue);
        }

        if (payrollPeriodValue) {
            const parsePayrollPeriod = parseInt(payrollPeriodValue, 10);
            if (!isNaN(parsePayrollPeriod)) {
                this.payrollPeriod.next(parsePayrollPeriod);
            }
        }

        if (payrollTypeValue) {
            const parsePayrollTypeValue = parseInt(payrollTypeValue, 10);
            if (!isNaN(parsePayrollTypeValue)) {
                this.payrollType.next(parsePayrollTypeValue);
            }
        }
    }
}
