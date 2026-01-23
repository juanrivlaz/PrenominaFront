import { Injectable } from "@angular/core";
import { AppConfigInterface } from "./app-config.interface";
import { BehaviorSubject } from "rxjs";
import { NavigationStart, Router } from "@angular/router";
import { SysKey } from "@core/models/enum/sys-key";
import { AuthService } from "../auth/auth.service";

@Injectable({
    providedIn: 'root'
})
export class AppConfigService {
    private blanksPage: Array<string> = [
        '/auth/recovery-password',
        '/auth/login',
    ];
    public settings: AppConfigInterface;
    public defaultSetting: AppConfigInterface;
    public onSettingsObserver: BehaviorSubject<AppConfigInterface>;
    public helpPage: BehaviorSubject<boolean>;
    public lastRoute: string = '';

    constructor(
        private readonly router: Router,
        private readonly authService: AuthService
    ) {
        const primaryColorValue = window.localStorage.getItem(SysKey.PrimaryColor) || '#5a6acf';
        const secondColorValue = window.localStorage.getItem(SysKey.SecondColor) || '#2196f3';
        const logo = window.localStorage.getItem(SysKey.Logo);

        this.defaultSetting = {
            layout: {
                navigation: 'left',
                navigationFolded: false,
                toolbar: 'above',
                footer: 'none',
                mode: 'fullwidth',
            },
            logo: logo || 'assets/icons/zoom-app.svg',
            primaryColor: primaryColorValue,
            secondColor: secondColorValue,
            loading: false
        };
        this.settings = this.defaultSetting;
        this.onSettingsObserver = new BehaviorSubject(this.settings);
        this.helpPage = new BehaviorSubject(false);
        document.documentElement.style.setProperty(SysKey.StylePrimaryColor, primaryColorValue);
        document.documentElement.style.setProperty(SysKey.StyleSecondColor, secondColorValue);

        this.router.events.subscribe(
            (event) => {
                if (event instanceof NavigationStart) {
                    this.defaultSetting.layout.navigation = 'left';
                    this.defaultSetting.layout.toolbar = 'above';

                    if (this.blanksPage.includes(event.url)) {
                        this.defaultSetting.layout.navigation = 'none';
                        this.defaultSetting.layout.toolbar = 'none';
                    }

                    this.setSettings(this.defaultSetting);
                }
            }
        );

        this.authService.getMe();
    }

    public setLogo(logo: string): void {
        window.localStorage.setItem(SysKey.Logo, logo);
        const updateSetting = {
            ...this.settings,
            logo,
        };

        this.setSettings(updateSetting);
    }

    public setLoading(loading: boolean): void {
        const updateSetting = {
            ...this.settings,
            loading,
        };

        this.setSettings(updateSetting);
    }

    public setPrimaryColor(color: string): void {
        window.localStorage.setItem(SysKey.PrimaryColor, color);
        document.documentElement.style.setProperty(SysKey.StylePrimaryColor, color);
        const updateSetting = {
            ...this.settings,
            primaryColor: color,
        };

        this.setSettings(updateSetting);
    }

    public setSecondColor(color: string): void {
        window.localStorage.setItem(SysKey.SecondColor, color);
        document.documentElement.style.setProperty(SysKey.StyleSecondColor, color);
        const updateSetting = {
            ...this.settings,
            secondColor: color,
        };

        this.setSettings(updateSetting);
    }

    private setSettings(settings: AppConfigInterface) {
        this.settings = settings;
        this.onSettingsObserver.next(this.settings);
    }
}