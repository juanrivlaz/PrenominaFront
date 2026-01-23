import { Component, Input, ViewEncapsulation } from "@angular/core";

@Component({
    selector: 'app-avatar',
    templateUrl: 'avatar.component.html',
    styleUrl: 'avatar.component.scss',
    encapsulation: ViewEncapsulation.None
})
export class AvatarComponent {
    @Input() name: string = '';

    public get label(): string {
        return this.name.split(" ")
        .filter(word => word.length > 0)
        .map(word => word[0].toUpperCase())
        .slice(0, 2)
        .join("");
    }
}