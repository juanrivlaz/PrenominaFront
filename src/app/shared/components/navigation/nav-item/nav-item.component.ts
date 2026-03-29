import { Component, HostBinding, input } from "@angular/core";
import { MenuIntemInterface } from "../../../interfaces/menu-item.interface";
import { CommonModule } from "@angular/common";
import { RouterLink, RouterLinkActive } from "@angular/router";
import { MaterialModule } from "../../../modules/material/material.module";

@Component({
    selector: 'app-nav-item',
    templateUrl: './nav-item.component.html',
    styleUrl: './nav-item.component.scss',
    imports: [CommonModule, RouterLink, RouterLinkActive, MaterialModule]
})
export class AppNavItem {
    @HostBinding('class') classes = 'nav-item';

    // Input usando signal-based API
    public readonly item = input<MenuIntemInterface | undefined>(undefined);
}
