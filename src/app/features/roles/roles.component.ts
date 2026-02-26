import { CommonModule } from "@angular/common";
import { Component, inject, OnInit, signal, ViewEncapsulation, WritableSignal } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { MaterialModule } from "@shared/modules/material/material.module";
import { CreateRoleComponent } from "./create-role/create-role.component";
import { Role } from "@core/models/role";
import { RolesService } from "./roles.service";
import { finalize } from "rxjs";
import { MatSnackBar } from "@angular/material/snack-bar";
import { AppConfigService } from "@core/services/app-config/app-config.service";
import { ICreateRole } from "./create-role/create-rol.interface";
import { MatTableDataSource, MatTableModule } from "@angular/material/table";
import { MatMenuModule } from "@angular/material/menu";

@Component({
    selector: 'app-roles',
    imports: [
        CommonModule,
        MaterialModule,
        MatTableModule,
        MatMenuModule,
    ],
    providers: [RolesService],
    templateUrl: './roles.component.html',
    styleUrl: './roles.component.scss',
    encapsulation: ViewEncapsulation.None
})
export class RolesComponent implements OnInit {
    private readonly _snackBar = inject(MatSnackBar);
    private readonly dialog = inject(MatDialog);
    public roles: MatTableDataSource<Role> = new MatTableDataSource<Role>([]);
    public loading: WritableSignal<boolean> = signal(true);
    public loadingItems: WritableSignal<Array<string>> = signal([]);
    public columns: Array<string> = [
        'code',
        'label',
        'sections',
        'actions'
    ];

    constructor(
        private readonly service: RolesService,
        private readonly configService: AppConfigService
    ) {}

    ngOnInit(): void {
        this.getRoles();
    }

    public handleChangeSearch(event: Event): void {
        const filterValue = (event.target as HTMLInputElement).value;
        this.roles.filter = filterValue.trim().toLowerCase();
    }

    public addRole(role?: Role): void {
        const dialogRef = this.dialog.open<CreateRoleComponent, ICreateRole>(CreateRoleComponent, {
            disableClose: true,
            data: {
                ...(role && { id: role.id }),
                code: role?.code || '',
                label: role?.label || '',
                sections: role?.sections || []
            }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                let newRoles = [];
                if (role) {
                    newRoles = [
                        ...this.roles.data.filter(r => r.id !== result.id),
                        result
                    ];
                } else {
                    newRoles = [
                        ...this.roles.data,
                        result
                    ];
                }

                this.roles = new MatTableDataSource<Role>(newRoles.sort((a, b) => a.label.localeCompare(b.label)));
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
                this.roles = new MatTableDataSource<Role>(response.sort((a, b) => a.label.localeCompare(b.label)));
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