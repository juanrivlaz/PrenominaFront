import { Component, HostBinding, Input, ViewEncapsulation } from "@angular/core";
import { MenuGroupInterface } from "../../../interfaces/menu-group.interface";
import { AppNavCollapse } from "../nav-collapse/nav-collapse.component";
import { AppNavItem } from "../nav-item/nav-item.component";
import { CommonModule } from "@angular/common";

@Component({
    selector: 'app-nav-group',
    templateUrl: './nav-group.component.html',
    styleUrl: './nav-group.component.scss',
    encapsulation: ViewEncapsulation.None,
    imports: [AppNavCollapse, AppNavItem, CommonModule]
})
export class AppNavGroup {
    @HostBinding('class') classes = 'nav-group nav-item';
    @Input() item: MenuGroupInterface | undefined;
}