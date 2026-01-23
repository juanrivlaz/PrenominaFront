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
import { BehaviorSubject } from "rxjs";

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    private jwtHelper: JwtHelperService;
    private sessionKey = 'auth-token';
    public token?: string;
    public typeTenant: BehaviorSubject<number> = new BehaviorSubject(TypeTenant.Department);
    public timeZone: BehaviorSubject<string> = new BehaviorSubject(TimeZone.Bahia_Banderas.toString());
    public activeCompany: BehaviorSubject<number> = new BehaviorSubject(0);
    public activeTenant: BehaviorSubject<string> = new BehaviorSubject('0');
    public payrollPeriod: BehaviorSubject<number> = new BehaviorSubject(0);
    public payrollType: BehaviorSubject<number> = new BehaviorSubject(0);
    public companies: BehaviorSubject<Array<Company>> = new BehaviorSubject<Array<Company>>([]);
    public centers: BehaviorSubject<Array<Center>> = new BehaviorSubject<Array<Center>>([]);
    public supervisors: BehaviorSubject<Array<Supervisor>> = new BehaviorSubject<Array<Supervisor>>([]);
    public sectionsForAccess: BehaviorSubject<Array<ISectionRol>> = new BehaviorSubject<Array<ISectionRol>>([]);

    constructor(private readonly httpService: HttpClient) {
        this.token = window.sessionStorage.getItem(this.sessionKey) || undefined;
        this.jwtHelper = new JwtHelperService();
        this.setInitDataSystem();
    }

    public get isLoggedIn(): boolean {
        if (!this.token) {
            return false;
        }

        return !this.jwtHelper.isTokenExpired(this.token);
    }

    public hasRole(roles: Array<string>): boolean {
        if (!roles.length) {
            return true;
        }

        return roles.includes(this.role);
    }

    public get role(): string {
        if (!this.token) {
            return '';
        }

        const decode = this.jwtHelper.decodeToken(this.token);

        return decode?.RoleCode || ''
    }

    public get userName(): string {
        if (!this.token) {
            return '';
        }

        const decode = this.jwtHelper.decodeToken(this.token);

        return decode?.given_name || ''
    }

    public login(loginResponse: ILoginResponse, update: boolean = false): void {
        const activeCompanyValue = window.sessionStorage.getItem(SysKey.ActiveCompany);
        const activeTenantValue = window.sessionStorage.getItem(SysKey.ActiveTenant);
        window.sessionStorage.setItem(this.sessionKey, loginResponse.token);
        this.token = loginResponse.token;

        this.companies.next(loginResponse.userDetails?.companies || []);
        this.centers.next(loginResponse.userDetails?.centers || []);
        this.supervisors.next(loginResponse.userDetails?.supervisors || []);

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
        window.sessionStorage.clear();
    }

    public setTypeTenant(typeTenant: number): void {
        const activeTenantValue = window.sessionStorage.getItem(SysKey.ActiveTenant);
        window.localStorage.setItem(SysKey.TypeTenant, typeTenant.toString());
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
        window.sessionStorage.setItem(SysKey.ActiveCompany, company.toString());
        if (this.activeCompany.value !== company) {
            this.activeCompany.next(company);
        }
    }

    public setActiveTenant(tenant: string): void {
        window.sessionStorage.setItem(SysKey.ActiveTenant, tenant.toString());
        if (this.activeTenant.value !== tenant) {
            this.activeTenant.next(tenant);
        }
    }

    public setPayrollPeriod(period: number): void {
        window.sessionStorage.setItem(SysKey.PayrollPeriod, period.toString());
        this.payrollPeriod.next(period);
    }

    public setPayrollType(type: number): void {
        window.sessionStorage.setItem(SysKey.PayrollType, type.toString());
        this.payrollType.next(type);
    }

    public setTimeZone(timeZone: TimeZone): void {
        window.localStorage.setItem(SysKey.TimeZone, timeZone);
        this.timeZone.next(timeZone);
    }

    public getMe(): void {
        this.httpService.get<ILoginResponse>('/User/me').subscribe({
            next: (response) => {
                this.login({
                    ...response,
                    token: this.token || '',
                }, false);
            },
            error: (err) => {
                console.log({
                    err
                });
            }
        });
    }

    private setInitDataSystem(): void {
        const typeTenantValue = window.localStorage.getItem(SysKey.TypeTenant);
        const timeZoneValue = window.localStorage.getItem(SysKey.TimeZone);
        const activeCompanyValue = window.sessionStorage.getItem(SysKey.ActiveCompany);
        const activeTenantValue = window.sessionStorage.getItem(SysKey.ActiveTenant);
        const payrollPeriodValue = window.sessionStorage.getItem(SysKey.PayrollPeriod);
        const payrollTypeValue = window.sessionStorage.getItem(SysKey.PayrollType);

        if (typeTenantValue) {
            const parseTypeTenant = parseInt(typeTenantValue, 10);
            this.typeTenant.next(parseTypeTenant);
        }

        if (timeZoneValue) {
            this.timeZone.next(timeZoneValue as TimeZone);
        }

        if (activeCompanyValue) {
            const parseActiveCompany = parseInt(activeCompanyValue, 10);
            this.activeCompany.next(parseActiveCompany);
        }

        if (activeTenantValue) {
            this.activeTenant.next(activeTenantValue);
        }

        if (payrollPeriodValue) {
            const parsePayrollPeriod = parseInt(payrollPeriodValue, 10);
            this.payrollPeriod.next(parsePayrollPeriod);
        }

        if (payrollTypeValue) {
            const parsePayrollTypeValue = parseInt(payrollTypeValue, 10);
            this.payrollType.next(parsePayrollTypeValue);
        }
    }
}