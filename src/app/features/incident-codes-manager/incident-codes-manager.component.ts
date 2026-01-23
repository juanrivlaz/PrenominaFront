import { CommonModule } from "@angular/common";
import { Component, inject, model, OnInit, signal, ViewEncapsulation, WritableSignal } from "@angular/core";
import { MaterialModule } from "../../shared/modules/material/material.module";
import { MatDialog } from "@angular/material/dialog";
import { AddIncidentCodeComponent } from "./add-incident-code/add-incident-code.component";
import { IAddIncidentCode } from "./add-incident-code/add-incident-code.interface";
import { IncidentCodesManagerService } from "./incident-codes-manager.service";
import { combineLatest, finalize } from "rxjs";
import { IUser } from "@core/models/user.interface";
import { IIncidentCode } from "@core/models/incident-code.interface";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { MatTableDataSource, MatTableModule } from "@angular/material/table";
import { MatMenuModule } from "@angular/material/menu";
import { DialogConfirmComponent } from "@shared/components/dialog-confirm/dialog-confirm.component";
import { IDialogConfirm } from "@shared/components/dialog-confirm/dialog-confirm.interface";

@Component({
    selector: 'app-incident-codes-manager',
    imports: [
        CommonModule,
        MaterialModule,
        MatProgressBarModule,
        MatTableModule,
        MatMenuModule,
    ],
    providers: [IncidentCodesManagerService],
    templateUrl: './incident-codes-manager.component.html',
    styleUrl: './incident-codes-manager.component.scss',
    encapsulation: ViewEncapsulation.None
})
export class IncidentCodesManagerComponent implements OnInit {
    public readonly incidentCode = signal('');
    public readonly name = model('');
    public readonly dialog = inject(MatDialog);
    public loading: WritableSignal<boolean> = signal(false);
    public users: WritableSignal<Array<IUser>> = signal([]);
    public listIncidentCode: MatTableDataSource<IIncidentCode> = new MatTableDataSource<IIncidentCode>([]);
    public columnTable: Array<string> = [
        'code',
        'externalCode',
        'label',
        'note',
        'withOperation',
        'actions'
    ];

    constructor(private readonly service: IncidentCodesManagerService) {}

    ngOnInit(): void {
        this.getInit();
    }

    public getInit(): void {
        this.loading.set(true);
        combineLatest([this.service.getInit(), this.service.get()]).pipe((finalize(() => {
            this.loading.set(false);
        }))).subscribe({
            next: (response) => {
                this.users.set(response[0]);
                this.listIncidentCode = new MatTableDataSource<IIncidentCode>(response[1]);
            },
            error: (err) => {
                console.log(err);
            }
        });
    }

    public addIncidentCode(): void {
        const dialogRef = this.dialog.open<AddIncidentCodeComponent, IAddIncidentCode>(AddIncidentCodeComponent, {
            data: {
                name: this.name(),
                incidentCode: this.incidentCode(),
                listUsers: this.users(),
            }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result !== undefined) {
                this.incidentCode.set(result);
                this.getInit();
            }
        });
    }

    public editIncidentCode(item: IIncidentCode): void {
        const dialogRef = this.dialog.open<AddIncidentCodeComponent, IAddIncidentCode>(AddIncidentCodeComponent, {
            data: {
                name: this.name(),
                incidentCode: this.incidentCode(),
                listUsers: this.users(),
                item: item
            }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result !== undefined) {
                this.incidentCode.set(result);
                this.getInit();
            }
        });
    }

    public deleteIncidentCode(id: number): void {
        const dialogRef = this.dialog.open<DialogConfirmComponent, IDialogConfirm, boolean>(DialogConfirmComponent, {
            data: {
                title: 'Eliminar código de incidente',
                message: '¿Estás seguro de que deseas eliminar este código de incidente?',
                confirmText: 'Eliminar',
                cancelText: 'Cancelar'
            }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (!result) {
                return;
            }
        });
    }

    public handleChangeSearch(event: Event): void {
        const filterValue = (event.target as HTMLInputElement).value;
        this.listIncidentCode.filter = filterValue.trim().toLowerCase();
    }
}