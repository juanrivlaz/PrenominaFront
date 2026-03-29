import { Component, computed, input, ViewEncapsulation } from "@angular/core";

@Component({
    selector: 'app-avatar',
    templateUrl: 'avatar.component.html',
    styleUrl: 'avatar.component.scss',
    encapsulation: ViewEncapsulation.None
})
export class AvatarComponent {
    // Input usando signal-based API
    public readonly name = input<string>('');

    // Computed signal para la etiqueta
    public readonly label = computed(() => {
        return this.name()
            .split(" ")
            .filter(word => word.length > 0)
            .map(word => word[0].toUpperCase())
            .slice(0, 2)
            .join("");
    });
}
