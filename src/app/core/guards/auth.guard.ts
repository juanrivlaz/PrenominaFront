import { Injectable } from "@angular/core";
import { ActivatedRouteSnapshot, CanActivate, GuardResult, MaybeAsync, Router, RouterStateSnapshot } from "@angular/router";
import { AppConfigService } from "../services/app-config/app-config.service";
import { AuthService } from "../services/auth/auth.service";

@Injectable({
    providedIn: 'root',
})
export class AuthGuard implements CanActivate {
    constructor(
        private readonly router: Router,
        private readonly appConfig: AppConfigService,
        private readonly authService: AuthService,
    ) {
        this.appConfig.lastRoute = '';
    }

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): MaybeAsync<GuardResult> {
        if (!this.authService.isLoggedIn) {
            this.appConfig.lastRoute = state.url;
            this.router.navigate(['/auth/login']);

            return false;
        }

        return true;
    }
}