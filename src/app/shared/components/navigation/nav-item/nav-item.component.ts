import { Component, HostBinding, Input } from "@angular/core";
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
    @Input() item?: MenuIntemInterface;
}