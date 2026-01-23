import { MenuIntemInterface } from './menu-item.interface';
import { MenuCollapseInterface } from './menu-collapse.interface';

export interface MenuGroupInterface {
    id: string;
    title: string;
    translate?: string;
    type: 'group';
    icon?: string; // references icon material
    iconCustom?: boolean;
    children: (MenuCollapseInterface | MenuGroupInterface | MenuIntemInterface)[];
}