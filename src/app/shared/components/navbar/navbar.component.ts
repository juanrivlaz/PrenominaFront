import { Component, model, ViewEncapsulation } from "@angular/core";
import { appAnimations } from "../../../core/animations";
import { AppNavigation } from "../navigation/navigation.component";
import { AppConfigService } from "@core/services/app-config/app-config.service";

@Component({
    selector: 'app-navbar',
    templateUrl: './navbar.component.html',
    styleUrl: './navbar.component.scss',
    animations: [appAnimations],
    encapsulation: ViewEncapsulation.None,
    imports: [AppNavigation]
})
export class AppNavbar {
    public logo = '';

    constructor(private readonly appConfigService: AppConfigService) {
        this.logo = appConfigService.settings.logo;

        this.appConfigService.onSettingsObserver.subscribe((setting) => {
            this.logo = setting.logo;
        });
    }
}