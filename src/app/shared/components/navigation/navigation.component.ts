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
        const itemsConfigs = ItemsNavigations.filter(item => 'isItemConfig' in item && item.isItemConfig === true);
        const itemsNonConfigs = ItemsNavigations.filter(item => !('isItemConfig' in item && item.isItemConfig === true));

        this.authService.sectionsForAccess.subscribe((item) => {
            if (this.authService.role === RoleCode.Sudo) {
                this.itemNavigation = itemsNonConfigs.concat([
                    {
                        id: 'allconfigs',
                        title: 'Configuración',
                        type: 'collapse',
                        icon: 'settings',
                        children: [
                            ...itemsConfigs
                        ],
                    }
                ]);
            } else {
                this.itemNavigation = itemsNonConfigs.filter((menu) => item.some((section) => section.sectionsCode.includes(menu.id)));
                const configItemsForAccess = itemsConfigs.filter((menu) => item.some((section) => section.sectionsCode.includes(menu.id)));
                if (configItemsForAccess.length > 0) {
                    this.itemNavigation.push({
                        id: 'allconfigs',
                        title: 'Configuración',
                        type: 'collapse',
                        icon: 'settings',
                        children: [
                            ...configItemsForAccess
                        ],
                    });
                }
            }
        });
    }
}