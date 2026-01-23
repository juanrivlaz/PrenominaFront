import { Component, HostBinding, Input } from "@angular/core";
import { appAnimations } from "../../../../core/animations";
import { MenuCollapseInterface } from "../../../interfaces/menu-collapse.interface";
import { AppNavItem } from "../nav-item/nav-item.component";
import { AppNavGroup } from "../nav-group/nav-group.component";
import { MaterialModule } from "../../../modules/material/material.module";
import { CommonModule } from "@angular/common";

@Component({
    selector: 'app-nav-collapse',
    templateUrl: './nav-collapse.component.html',
    styleUrl: './nav-collapse.component.scss',
    animations: appAnimations,
    imports: [AppNavItem, AppNavGroup, MaterialModule, CommonModule]
})
export class AppNavCollapse {
    @Input() item: MenuCollapseInterface | undefined;
    @HostBinding('class') classes = 'nav-collapse nav-item';
    @HostBinding('class.open') isOpen = false;

    constructor() {}

    public toggleOpen(ev: Event): void
    {
        ev.preventDefault();

        this.isOpen = !this.isOpen;
    }
}