import { CommonModule } from "@angular/common";
import { Component, computed, inject, signal, ViewEncapsulation } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogRef, MatDialogTitle } from "@angular/material/dialog";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatTableDataSource, MatTableModule } from "@angular/material/table";
import { MatSelectModule } from "@angular/material/select";
import { SelectionModel } from "@angular/cdk/collections";
import { MatSnackBar } from "@angular/material/snack-bar";
import { MaterialModule } from "@shared/modules/material/material.module";
import { IClockUser } from "@core/models/clock-user.interface";
import { IClock } from "@core/models/clock.interface";
import { finalize } from "rxjs";
import { ClocksService } from "../clocks.service";
import { ISyncUsersDialogData } from "./sync-users.interface";

@Component({
    selector: 'app-sync-users',
    imports: [
        CommonModule,
        MaterialModule,
        MatDialogContent,
        MatDialogActions,
        MatDialogClose,
        MatDialogTitle,
        MatProgressSpinnerModule,
        MatTableModule,
        MatSelectModule
    ],
    providers: [ClocksService],
    templateUrl: './sync-users.component.html',
    styleUrl: './sync-users.component.scss',
    encapsulation: ViewEncapsulation.None
})
export class SyncUsersComponent {
    private readonly _snackBar = inject(MatSnackBar);
    private readonly dialogRef = inject(MatDialogRef<SyncUsersComponent>);
    public readonly data = inject<ISyncUsersDialogData>(MAT_DIALOG_DATA);
    private readonly service = inject(ClocksService);

    public readonly columnTable: Array<string> = ['select', 'employeeNumber', 'name', 'privilege', 'enable'];
    public readonly dataSource = new MatTableDataSource<IClockUser>([]);
    public readonly selection = new SelectionModel<IClockUser>(true, []);
    public readonly loading = signal<boolean>(false);
    public readonly syncing = signal<boolean>(false);
    public readonly selectedCount = signal<number>(0);

    /** Available clocks as target (only in 'clock' mode). */
    public readonly targets: Array<IClock> = this.data.targets ?? [];
    /** Target clock selected in 'clock' mode. */
    public readonly selectedTarget = signal<IClock | null>(null);

    public readonly title = computed(() =>
        this.data.mode === 'db'
            ? 'Sincronizar usuarios desde la base de datos'
            : `Copiar usuarios desde ${this.data.clock.label}`
    );

    /** True when the sync button should be enabled. */
    public readonly canSync = computed(() => {
        if (this.selectedCount() === 0 || this.syncing() || this.loading()) {
            return false;
        }
        return this.data.mode === 'db' || this.selectedTarget() !== null;
    });

    constructor() {
        this.loadUsers();
    }

    private loadUsers(): void {
        this.loading.set(true);

        // In 'db' mode the database users are read; in 'clock' mode the source clock's users.
        const request$ = this.data.mode === 'db'
            ? this.service.getDbUsers()
            : this.service.getClockUser(this.data.clock.id);

        request$.pipe(finalize(() => this.loading.set(false))).subscribe({
            next: (response) => {
                this.dataSource.data = response;
            },
            error: (err) => {
                const message = err.error?.message || 'No fue posible cargar los usuarios';
                this.notify(message, false);
            }
        });
    }

    public handleChangeSearch(event: Event): void {
        const filterValue = (event.target as HTMLInputElement).value;
        this.dataSource.filter = filterValue.trim().toLowerCase();
    }

    public isAllSelected(): boolean {
        return this.dataSource.data.length > 0 && this.selection.selected.length === this.dataSource.data.length;
    }

    public toggleAllRows(): void {
        if (this.isAllSelected()) {
            this.selection.clear();
        } else {
            this.selection.select(...this.dataSource.data);
        }
        this.selectedCount.set(this.selection.selected.length);
    }

    public toggleRow(row: IClockUser): void {
        this.selection.toggle(row);
        this.selectedCount.set(this.selection.selected.length);
    }

    public sync(): void {
        if (!this.canSync()) {
            return;
        }

        const enrollNumbers = this.selection.selected.map((user) => user.enrollNumber);

        this.syncing.set(true);

        let request$;
        if (this.data.mode === 'db') {
            request$ = this.service.syncDbToClock(this.data.clock.id, enrollNumbers);
        } else {
            request$ = this.service.syncClockToClock(this.data.clock.id, this.selectedTarget()!.id, enrollNumbers);
        }

        request$.pipe(finalize(() => this.syncing.set(false))).subscribe({
            next: (response) => {
                this.notify(response?.message || 'Usuarios sincronizados correctamente', true);
                this.dialogRef.close(response);
            },
            error: (err) => {
                const message = err.error?.message || 'Ocurrió un error, por favor intentalo más tarde';
                this.notify(message, false);
            }
        });
    }

    private notify(message: string, success: boolean): void {
        this._snackBar.open(message, success ? '✅' : '❌', {
            horizontalPosition: 'center',
            verticalPosition: 'top',
            panelClass: success ? 'alert-success' : 'alert-error',
            duration: success ? 4000 : 3000
        });
    }
}
