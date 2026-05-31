import { Injectable } from "@angular/core";
import { AppConfigInterface } from "./app-config.interface";
import { BehaviorSubject, Observable } from "rxjs";
import { NavigationStart, Router } from "@angular/router";
import { SysKey } from "@core/models/enum/sys-key";
import { AuthService } from "../auth/auth.service";
import { HttpClient } from "@angular/common/http";

interface ISysAppearance {
    primaryColor: string;
    secondColor: string;
    logo: string;
}

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
    private readonly DEFAULT_LOGO = 'assets/icons/zoom-app.svg';

    constructor(
        private readonly router: Router,
        private readonly authService: AuthService,
        private readonly http: HttpClient,
    ) {
        // Cache local para arranque inmediato; se sobreescribe con la versión del backend.
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
            logo: logo || this.DEFAULT_LOGO,
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

        // Cargar apariencia compartida desde el backend (afecta a todos los usuarios).
        this.loadAppearanceFromServer();
    }

    public loadAppearanceFromServer(): void {
        this.http.get<ISysAppearance>('/SystemConfig/appearance').subscribe({
            next: (appearance) => {
                if (!appearance) return;
                if (appearance.primaryColor) {
                    this.applyPrimaryColor(appearance.primaryColor);
                }
                if (appearance.secondColor) {
                    this.applySecondColor(appearance.secondColor);
                }
                if (appearance.logo !== undefined && appearance.logo !== null) {
                    this.applyLogo(appearance.logo || this.DEFAULT_LOGO);
                }
            },
            error: () => {
                // Si falla, mantenemos el cache local. No bloqueante.
            }
        });
    }

    public saveAppearanceToServer(payload: Partial<ISysAppearance>): Observable<boolean> {
        return this.http.put<boolean>('/SystemConfig/appearance', payload);
    }

    private applyLogo(logo: string): void {
        window.localStorage.setItem(SysKey.Logo, logo);
        this.setSettings({ ...this.settings, logo });
    }

    private applyPrimaryColor(color: string): void {
        window.localStorage.setItem(SysKey.PrimaryColor, color);
        document.documentElement.style.setProperty(SysKey.StylePrimaryColor, color);
        this.setSettings({ ...this.settings, primaryColor: color });
    }

    private applySecondColor(color: string): void {
        window.localStorage.setItem(SysKey.SecondColor, color);
        document.documentElement.style.setProperty(SysKey.StyleSecondColor, color);
        this.setSettings({ ...this.settings, secondColor: color });
    }

    public setLogo(logo: string): void {
        this.applyLogo(logo);
        this.saveAppearanceToServer({ logo }).subscribe();
    }

    public setLoading(loading: boolean): void {
        const updateSetting = {
            ...this.settings,
            loading,
        };

        this.setSettings(updateSetting);
    }

    public setPrimaryColor(color: string): void {
        this.applyPrimaryColor(color);
        this.saveAppearanceToServer({ primaryColor: color }).subscribe();
    }

    public setSecondColor(color: string): void {
        this.applySecondColor(color);
        this.saveAppearanceToServer({ secondColor: color }).subscribe();
    }

    private setSettings(settings: AppConfigInterface) {
        this.settings = settings;
        this.onSettingsObserver.next(this.settings);
    }
}