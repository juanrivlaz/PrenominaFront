import { CommonModule } from "@angular/common";
import { Component, inject, signal, ViewEncapsulation, WritableSignal } from "@angular/core";
import { MatMenuModule } from "@angular/material/menu";
import { MatPaginatorModule } from "@angular/material/paginator";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { IFileIncident } from "@core/models/file-incident.interface";
import { MaterialModule } from "@shared/modules/material/material.module";
import { FileIncidentService } from "./file-incident.service";
import { MatDialog } from "@angular/material/dialog";
import { CreateFileIncidentComponent } from "./create-file-incident/create-file-incident.component";

@Component({
    selector: 'app-file-incident',
    imports: [
        CommonModule,
        MaterialModule,
        MatMenuModule,
        MatPaginatorModule,
        MatProgressSpinnerModule,
        MatProgressBarModule
    ],
    providers: [
        FileIncidentService
    ],
    templateUrl: './file-incident.component.html',
    styleUrl: './file-incident.component.scss',
    encapsulation: ViewEncapsulation.None
})
export class FileIncidentComponent {
    readonly dialog = inject(MatDialog);
    public loading: WritableSignal<boolean> = signal(true);
    public listFileIncident: WritableSignal<Array<IFileIncident>> = signal([]);

    constructor(private readonly service: FileIncidentService) {}

    public addFile(): void {
        const dialogRef = this.dialog.open<CreateFileIncidentComponent>(CreateFileIncidentComponent, {
            panelClass: 'dialog-file-incident'
        });

        dialogRef.afterClosed().subscribe(result => {
            console.log({
                result
            });
        });
    }
}