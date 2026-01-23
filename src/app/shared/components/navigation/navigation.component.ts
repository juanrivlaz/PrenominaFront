import { Component, ViewEncapsulation } from "@angular/core";
import { MenuIntemInterface } from "../../interfaces/menu-item.interface";
import { MenuCollapseInterface } from "../../interfaces/menu-collapse.interface";
import { MenuGroupInterface } from "../../interfaces/menu-group.interface";
import { AppNavCollapse } from "./nav-collapse/nav-collapse.component";
import { AppNavGroup } from "./nav-group/nav-group.component";
import { AppNavItem } from "./nav-item/nav-item.component";
import { CommonModule } from "@angular/common";
import { AuthService } from "@core/services/auth/auth.service";
import { RoleCode } from "@core/models/enum/role-code";
import { ItemsNavigations } from "@core/models/constants/items-navigations";

@Component({
    selector: 'app-navigation',
    templateUrl: './navigation.component.html',
    styleUrl: './navigation.component.scss',
    encapsulation: ViewEncapsulation.None,
    imports: [AppNavCollapse, AppNavGroup, AppNavItem, CommonModule]
})
export class AppNavigation {
    public itemNavigation: Array<MenuIntemInterface | MenuCollapseInterface | MenuGroupInterface> = [];

    constructor(private readonly authService: AuthService) {
        this.authService.sectionsForAccess.subscribe((item) => {
            if (this.authService.role === RoleCode.Sudo) {
                this.itemNavigation = ItemsNavigations;
            } else {
                this.itemNavigation = ItemsNavigations.filter((menu) => item.some((section) => section.sectionsCode.includes(menu.id)));
            }
        });
    }
}