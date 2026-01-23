import { CommonModule } from "@angular/common";
import { Component, inject, OnInit, signal, ViewEncapsulation, WritableSignal } from "@angular/core";
import { AvatarComponent } from "../../shared/components/avatar/avatar.component";
import { MaterialModule } from "../../shared/modules/material/material.module";
import { MatDialog } from "@angular/material/dialog";
import { CreateUserComponent } from "./create-user/create-user.component";
import { UsersService } from "./users.service";
import { AppConfigService } from "@core/services/app-config/app-config.service";
import { finalize, forkJoin } from "rxjs";
import { MatSnackBar } from "@angular/material/snack-bar";
import { ICreateUser } from "./create-user/create-user.interface";
import { AuthService } from "@core/services/auth/auth.service";
import { Center } from "@core/models/center";
import { Company } from "@core/models/company";
import { Role } from "@core/models/role";
import { Supervisor } from "@core/models/supervisor";
import { MatTableDataSource, MatTableModule } from "@angular/material/table";
import { IUserWithDetails } from "@core/models/user-with-details.interface";
import { TypeTenant } from "@core/models/enum/type-tenant";
import { MatMenuModule } from "@angular/material/menu";
import { DialogConfirmComponent } from "@shared/components/dialog-confirm/dialog-confirm.component";
import { IDialogConfirm } from "@shared/components/dialog-confirm/dialog-confirm.interface";

@Component({
    selector: 'app-users',
    imports: [
        CommonModule,
        MaterialModule,
        AvatarComponent,
        MatTableModule,
        MatMenuModule
    ],
    providers: [UsersService],
    templateUrl: './users.component.html',
    styleUrl: './users.component.scss',
    encapsulation: ViewEncapsulation.None
})
export class UsersComponent implements OnInit {
    private readonly _snackBar = inject(MatSnackBar);
    public readonly dialog = inject(MatDialog);
    public centers: WritableSignal<Array<Center>> = signal([]);
    public companies: WritableSignal<Array<Company>> = signal([]);
    public roles: WritableSignal<Array<Role>> = signal([]);
    public supervisors: WritableSignal<Array<Supervisor>> = signal([]);
    public users: MatTableDataSource<IUserWithDetails> = new MatTableDataSource<IUserWithDetails>([]);
    public columns: Array<string> = [
        'name',
        'email',
        'rol',
        'companies',
        'tenants',
        'actions'
    ];
    public loadingItems: WritableSignal<Array<string>> = signal([]);

    constructor(
        private readonly service: UsersService,
        private readonly configService: AppConfigService,
        private readonly authService: AuthService
    ) {}

    ngOnInit(): void {
        this.getInit();
    }

    public addUser(): void {
        const dialogRef = this.dialog.open<CreateUserComponent, ICreateUser, { user: IUserWithDetails }>(CreateUserComponent, {
            data: {
                centers: this.centers(),
                companies: this.companies(),
                roles: this.roles(),
                supervisors: this.supervisors(),
                typeTenant: this.authService.typeTenant.getValue(),
                service: this.service
            }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result?.user) {
                this.users = new MatTableDataSource([...this.users.data, {
                    ...result.user,
                    totalTenants: result.user.userCompanies.reduce((acc, company) => acc + (this.authService.typeTenant.getValue() === TypeTenant.Department ? (company.userDepartments?.length || 0) : (company.userSupervisors?.length || 0)), 0)
                }]);
            }
        });
    }

    public editUser(user: IUserWithDetails): void {
        const dialogRef = this.dialog.open<CreateUserComponent, ICreateUser, { user: IUserWithDetails }>(CreateUserComponent, {
            data: {
                centers: this.centers(),
                companies: this.companies(),
                roles: this.roles(),
                supervisors: this.supervisors(),
                typeTenant: this.authService.typeTenant.getValue(),
                service: this.service,
                editData: user
            }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result?.user) {
                this.users = new MatTableDataSource([...this.users.data.filter(user => user.id !== result.user.id), {
                    ...result.user,
                    totalTenants: result.user.userCompanies.reduce((acc, company) => acc + (this.authService.typeTenant.getValue() === TypeTenant.Department ? (company.userDepartments?.length || 0) : (company.userSupervisors?.length || 0)), 0)
                }]);
            }
        });
    }

    public deleteUser(userId: string): void {
        const dialogRef = this.dialog.open<DialogConfirmComponent, IDialogConfirm, boolean>(DialogConfirmComponent, {
            data: {
                title: 'Confirmar eliminación',
                message: '¿Estás seguro de que deseas eliminar este usuario?',
                confirmText: 'Eliminar',
                cancelText: 'Cancelar'
            }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (!result) {
                return;
            }

            this.loadingItems.update((values) => [...values, userId]);
            this.service.delete(userId).pipe(finalize(() => {
                this.loadingItems.update((values) => values.filter((item) => item !== userId));
            })).subscribe({
                next: () => {
                    this.users = new MatTableDataSource(this.users.data.filter(user => user.id !== userId));
                    this._snackBar.open('El usuario ha sido eliminado', '✅', {
                        horizontalPosition: 'center',
                        verticalPosition: 'top',
                        panelClass: 'alert-success',
                        duration: 3000
                    });
                },
                error: (err) => {
                    const message = err.error?.message || 'Ocurrió un error, por favor intentalo más tarde';

                    this._snackBar.open(message, '❌', {
                        horizontalPosition: 'center',
                        verticalPosition: 'top',
                        panelClass: 'alert-error',
                        duration: 3000
                    });
                }
            });
        });
    }

    private getInit(): void {
        this.configService.setLoading(true);
        forkJoin([this.service.init(), this.service.getAll()]).pipe(finalize(() => {
            this.configService.setLoading(false);
        })).subscribe({
           next: (response) => {
            this.centers.set(response[0].centers || []);
            this.companies.set(response[0].companies);
            this.roles.set(response[0].roles);
            this.supervisors.set(response[0].supervisors || []);
            this.users = new MatTableDataSource(response[1].map(user => ({
                ...user,
                totalTenants: user.userCompanies.reduce((acc, company) => acc + (this.authService.typeTenant.getValue() === TypeTenant.Department ? (company.userDepartments?.length || 0) : (company.userSupervisors?.length || 0)), 0)
            })));
           },
           error: (err) => {
            const message = err.error?.message || 'Ocurrió un error, por favor intentalo más tarde';

            this._snackBar.open(message, '❌', {
                horizontalPosition: 'center',
                verticalPosition: 'top',
                panelClass: 'alert-error',
                duration: 3000
            });
           }
        });
    }
}