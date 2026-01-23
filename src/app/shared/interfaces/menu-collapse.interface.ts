import { MenuGroupInterface } from "./menu-group.interface";
import { MenuIntemInterface } from "./menu-item.interface";

export interface MenuCollapseInterface {
    id: string;
    title: string;
    translate?: string;
    type: 'collapse';
    icon?: string; // references icon material
    iconCustom?: boolean;
    children: (MenuCollapseInterface | MenuGroupInterface | MenuIntemInterface)[];
}