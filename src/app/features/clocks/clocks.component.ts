import { CommonModule } from "@angular/common";
import { Component, inject, model, OnDestroy, OnInit, signal, ViewEncapsulation, WritableSignal } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { MatListModule } from "@angular/material/list";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MaterialModule } from "@shared/modules/material/material.module";
import { CreateClockComponent } from "./create-clock/create-clock.component";
import { IClock } from "@core/models/clock.interface";
import { ClocksService } from "./clocks.service";
import { MatSnackBar } from "@angular/material/snack-bar";
import { finalize } from "rxjs";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatMenuModule } from "@angular/material/menu";
import { ClockUsersComponent } from "./clock-users/clock-users.component";
import { IClockUsersModal } from "./clock-users/clock-users.interface";
import { SyncUsersComponent } from "./sync-users/sync-users.component";
import { ISyncUsersDialogData } from "./sync-users/sync-users.interface";
import { AuthService } from "@core/services/auth/auth.service";
import { ConfirmDialogComponent, ConfirmDialogData } from "@shared/components/confirm-dialog/confirm-dialog.component";
import dayjs from "dayjs";

@Component({
    selector: 'app-clocks',
    imports: [
        CommonModule,
        MaterialModule,
        MatListModule,
        MatTooltipModule,
        MatProgressSpinnerModule,
        MatMenuModule
    ],
    providers: [ClocksService],
    templateUrl: './clocks.component.html',
    styleUrl: './clocks.component.scss',
    encapsulation: ViewEncapsulation.None
})
export class ClocksComponent implements OnInit, OnDestroy {
    private readonly _snackBar = inject(MatSnackBar);
    public readonly dialog = inject(MatDialog);
    private readonly authService = inject(AuthService);
    public listClocks = model<Array<IClock>>([]);
    public loadingClocks = model<Array<string>>([]);
    public nowTick: WritableSignal<number> = signal(Date.now());
    private nowInterval?: ReturnType<typeof setInterval>;

    // Solo los usuarios con rol Sudo pueden editar o eliminar relojes.
    public get isSudo(): boolean {
        return this.authService.role === 'sudo';
    }

    constructor(private readonly service: ClocksService) {}

    ngOnInit(): void {
        this.getClocks();
        this.nowInterval = setInterval(() => this.nowTick.set(Date.now()), 30000);
    }

    ngOnDestroy(): void {
        if (this.nowInterval) {
            clearInterval(this.nowInterval);
        }
    }

    public formatLastSync(date: string | null, _tick?: number): string {
        if (!date) return 'Nunca sincronizado';
        return `${dayjs(date).format('DD/MM/YYYY HH:mm')} (${dayjs(date).fromNow()})`;
    }

    public addClock(): void {
        const dialogRef = this.dialog.open<CreateClockComponent>(CreateClockComponent, {});

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.listClocks.set([...this.listClocks(), result]);
            }
        });
    }

    public editClock(clock: IClock): void {
        if (!this.isSudo) {
            return;
        }

        const dialogRef = this.dialog.open<CreateClockComponent, IClock, IClock>(CreateClockComponent, {
            data: clock
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.listClocks.set(this.listClocks().map((item) => item.id === result.id ? result : item));
            }
        });
    }

    public deleteClock(clock: IClock): void {
        if (!this.isSudo) {
            return;
        }

        const dialogRef = this.dialog.open<ConfirmDialogComponent, ConfirmDialogData, boolean>(ConfirmDialogComponent, {
            width: '450px',
            data: {
                title: 'Eliminar reloj',
                message: `¿Estás seguro de eliminar el reloj "${clock.label}"? Esta acción no se puede deshacer.`,
                confirmText: 'Eliminar',
                cancelText: 'Cancelar',
                confirmColor: 'warn'
            }
        });

        dialogRef.afterClosed().subscribe(confirmed => {
            if (!confirmed) {
                return;
            }

            this.loadingClocks.set([...this.loadingClocks(), clock.id]);
            this.service.delete(clock.id).pipe(finalize(() => {
                this.loadingClocks.set(this.loadingClocks().filter((item) => item !== clock.id));
            })).subscribe({
                next: () => {
                    this.listClocks.set(this.listClocks().filter((item) => item.id !== clock.id));
                    this._snackBar.open('Reloj eliminado correctamente', '✅', {
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

    public showClockUsers(clock: IClock): void {
        const dialogRef = this.dialog.open<ClockUsersComponent, IClockUsersModal>(ClockUsersComponent, {
            data: {
                id: clock.id
            }
        });

        dialogRef.afterClosed().subscribe(result => {
            console.log({ result });
        });
    }

    public sendPing(clock: IClock): void {
        this.loadingClocks.set([...this.loadingClocks(), clock.id]);
        this.service.sendPing({
            IP: clock.ip,
        }).pipe(finalize(() => {
            this.loadingClocks.set(this.loadingClocks().filter((item) => item !== clock.id));
        })).subscribe({
            next: (response) => {
                const message = response ? 'El reloj se encuentra en línea.' : 'No ha sido posible conectar con el reloj.';

                this._snackBar.open(message, response ? '✅' : '❌', {
                    horizontalPosition: 'center',
                    verticalPosition: 'top',
                    panelClass: response ? 'alert-success' : 'alert-error',
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
            },
        })
    }

    public syncAttendace(clockId: string): void {
        this.loadingClocks.set([...this.loadingClocks(), clockId]);
        this.service.syncClockAttendace(clockId).pipe(finalize(() => {
            this.loadingClocks.set(this.loadingClocks().filter((item) => item !== clockId));
        })).subscribe({
            next: () => {
                const message = 'Las checadas fueron sincronizadas exitosamente';

                this._snackBar.open(message, '✅', {
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
        })
    }

    public isLoading(clock: IClock): boolean {
        return this.loadingClocks().some((item) => item === clock.id);
    }

    // Otros relojes disponibles como destino para copiar usuarios.
    public otherClocks(clock: IClock): Array<IClock> {
        return this.listClocks().filter((item) => item.id !== clock.id);
    }

    // Opens the dialog to select which database users are synced to the clock.
    public syncUsersFromDb(clock: IClock): void {
        this.dialog.open<SyncUsersComponent, ISyncUsersDialogData>(SyncUsersComponent, {
            data: {
                mode: 'db',
                clock
            }
        });
    }

    // Opens the dialog to copy users from this clock to another; the target is chosen inside the modal.
    public copyUsersToClock(source: IClock): void {
        this.dialog.open<SyncUsersComponent, ISyncUsersDialogData>(SyncUsersComponent, {
            data: {
                mode: 'clock',
                clock: source,
                targets: this.otherClocks(source)
            }
        });
    }

    private getClocks(): void {
        this.service.get().pipe(finalize(() => {
            console.log('complete');
        })).subscribe({
            next: (response) => {
                this.listClocks.set(response);
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