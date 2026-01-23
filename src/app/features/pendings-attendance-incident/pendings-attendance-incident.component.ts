import { CommonModule } from "@angular/common";
import { Component, inject, ViewEncapsulation } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { AvatarComponent } from "@shared/components/avatar/avatar.component";
import { MaterialModule } from "@shared/modules/material/material.module";
import { ConfirmActionComponent } from "./confirm-action/confirm-action.component";
import { IConfirmAction } from "./confirm-action/confirm-action.interface";

@Component({
    selector: 'app-pendings-attendamce-incident',
    imports: [CommonModule, MaterialModule, AvatarComponent],
    templateUrl: './pendings-attendance-incident.component.html',
    styleUrl: './pendings-attendance-incident.component.scss',
    encapsulation: ViewEncapsulation.None
})
export class PendingsAttendanceIncidentComponent {
    readonly dialog = inject(MatDialog);

    public handleClickAction(
        approve: boolean
    ): void {
        const dialogRef = this.dialog.open<ConfirmActionComponent, IConfirmAction>(ConfirmActionComponent, {
            data: {
                type: approve ? 'Aprobar' : 'Rechazar',
                name: 'Axel Daniel Rivera Maravillas',
                incident: 'F | Falta',
                date: new Date(),
            }
        });

        dialogRef.afterClosed().subscribe(result => {
            console.log(result);
        });
    }
}