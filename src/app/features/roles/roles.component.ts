import { CommonModule } from "@angular/common";
import { Component, inject, OnInit, signal, ViewEncapsulation, WritableSignal } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { MaterialModule } from "@shared/modules/material/material.module";
import { CreateRoleComponent } from "./create-role/create-role.component";
import { Role } from "@core/models/role";
import { RolesService } from "./roles.service";
import { finalize } from "rxjs";
import { MatSnackBar } from "@angular/material/snack-bar";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { AppConfigService } from "@core/services/app-config/app-config.service";

@Component({
    selector: 'app-roles',
    imports: [CommonModule, MaterialModule, MatProgressBarModule],
    providers: [RolesService],
    templateUrl: './roles.component.html',
    styleUrl: './roles.component.scss',
    encapsulation: ViewEncapsulation.None
})
export class RolesComponent implements OnInit {
    private readonly _snackBar = inject(MatSnackBar);
    private readonly dialog = inject(MatDialog);
    public listRoles: Array<Role> = [];
    public loading: WritableSignal<boolean> = signal(true);

    constructor(
        private readonly service: RolesService,
        private readonly configService: AppConfigService
    ) {}

    ngOnInit(): void {
        this.getRoles();
    }

    public addRole(): void {
        const dialogRef = this.dialog.open<CreateRoleComponent>(CreateRoleComponent, {
            disableClose: true,
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.listRoles.push(result);
            }
        });
    }

    private getRoles(): void {
        this.configService.setLoading(true);
        this.service.get().pipe(finalize(() => {
            this.loading.set(false);
            this.configService.setLoading(false);
        })).subscribe({
            next: (response) => {
                this.listRoles = response;
            },
            error: (err) => {
                const message = err.error?.message || 'Ocurrió un error, por favor intentalo más tarde';

                this._snackBar.open(message, undefined, {
                    horizontalPosition: 'center',
                    verticalPosition: 'top',
                    panelClass: 'alert-error',
                    duration: 3000
                });
            }
        })
    }
}