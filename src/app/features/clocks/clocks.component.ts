import { CommonModule } from "@angular/common";
import { Component, inject, model, OnInit, ViewEncapsulation } from "@angular/core";
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
import { ClockUsersComponent } from "./clock-users/clock-users.component";
import { IClockUsersModal } from "./clock-users/clock-users.interface";

@Component({
    selector: 'app-clocks',
    imports: [
        CommonModule,
        MaterialModule,
        MatListModule,
        MatTooltipModule,
        MatProgressSpinnerModule
    ],
    providers: [ClocksService],
    templateUrl: './clocks.component.html',
    styleUrl: './clocks.component.scss',
    encapsulation: ViewEncapsulation.None
})
export class ClocksComponent implements OnInit {
    private readonly _snackBar = inject(MatSnackBar);
    public readonly dialog = inject(MatDialog);
    public listClocks = model<Array<IClock>>([]);
    public loadingClocks = model<Array<string>>([]);

    constructor(private readonly service: ClocksService) {}

    ngOnInit(): void {
        this.getClocks();
    }

    public addClock(): void {
        const dialogRef = this.dialog.open<CreateClockComponent>(CreateClockComponent, {});

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.listClocks.set([...this.listClocks(), result]);
            }
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