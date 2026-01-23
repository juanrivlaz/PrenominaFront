import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { ItemsNavigations } from "@core/models/constants/items-navigations";
import { RoleCode } from "@core/models/enum/role-code";
import { ILoginResponse } from "@core/models/login-response.interface";
import { ILoginResult } from "@core/models/login-result.interface";
import { ILogin } from "@core/models/login.interface";
import { AuthService as AuthSysService } from "@core/services/auth/auth.service";
import { MenuIntemInterface } from "@shared/interfaces/menu-item.interface";
import { map, Observable } from "rxjs";

@Injectable()
export class AuthService {
    constructor(
        private readonly httpService: HttpClient,
        private readonly service: AuthSysService
    ) {}

    public login(form: ILogin): Observable<ILoginResult> {
        return this.httpService.post<ILoginResponse>('/Auth', form).pipe(
            map((response) => {
                this.service.login(response);
                const codeMenu = response.userDetails.role.sections?.[0]?.sectionsCode;
                let findFirstMenu = ItemsNavigations.find(item => item.id === codeMenu) as MenuIntemInterface;

                if (response.userDetails.role.code === RoleCode.Sudo) {
                    findFirstMenu = ItemsNavigations[0] as MenuIntemInterface;
                }

                return {
                    success: true,
                    url: findFirstMenu.url || '',
                };
            }),
        );
    }
}