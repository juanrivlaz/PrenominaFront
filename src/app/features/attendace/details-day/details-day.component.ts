import { CommonModule } from "@angular/common";
import { Component, inject, signal, ViewEncapsulation, WritableSignal } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { MatDividerModule } from "@angular/material/divider";
import { MatListModule } from "@angular/material/list";
import { MatIconModule } from "@angular/material/icon";
import { AvatarComponent } from "@shared/components/avatar/avatar.component";
import { DialogModule } from "@shared/modules/material/dialog.module";
import { MaterialModule } from "@shared/modules/material/material.module";
import { IDetailsDay } from "./details-day.interface";
import { LongPressDirective } from "@core/directives/long-press.directive";
import { MatTooltipModule } from "@angular/material/tooltip";
import { finalize } from "rxjs";
import { MatSnackBar } from "@angular/material/snack-bar";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";

@Component({
    selector: 'app-detail-day',
    imports: [
        CommonModule,
        MaterialModule,
        DialogModule,
        AvatarComponent,
        MatDividerModule,
        MatListModule,
        MatIconModule,
        LongPressDirective,
        MatTooltipModule,
        MatProgressSpinnerModule
    ],
    templateUrl: './details-day.component.html',
    styleUrl: './details-day.component.scss',
    encapsulation: ViewEncapsulation.None,
})
export class DetailDayComponent {
    private readonly _snackBar = inject(MatSnackBar);
    private readonly dialogRef = inject(MatDialogRef<DetailDayComponent, { deleted: Array<string> }>);
    private idsForDelete: WritableSignal<Array<string>> = signal([]);
    public readonly data = inject<IDetailsDay>(MAT_DIALOG_DATA);
    public confirmDelete: WritableSignal<boolean> = signal(false);
    public loading: WritableSignal<boolean> = signal(false);

    public onCancel(): void {
        this.confirmDelete.set(false);
        this.dialogRef.close({
            deleted: []
        });
    }

    public deleteItem(id: string): void {
        this.confirmDelete.set(false);
        this.idsForDelete.update(items => [...items, id]);
    }

    public rollbackDelete(id: string): void {
        this.confirmDelete.set(false);
        this.idsForDelete.update(items => items.filter((item) => item !== id));
    }

    public isForDelete(id: string): boolean {
        return this.idsForDelete().some((item) => item === id);
    }

    public get disabledDelete(): boolean {
        return !this.idsForDelete().length;
    }

    public applyDelete(): void {
        this.confirmDelete.set(true);
    }

    public deleteItems(): void {
        this.dialogRef.disableClose = true;
        this.loading.set(true);

        this.data.service.deleteIncidents(this.idsForDelete()).pipe(finalize(() => {
            this.loading.set(false);
        })).subscribe({
            next: () => {
                this._snackBar.open('Las incidencias fueron eliminadas', '✅', {
                    horizontalPosition: 'center',
                    verticalPosition: 'top',
                    panelClass: 'alert-success',
                    duration: 3000
                });

                this.dialogRef.close({
                    deleted: this.idsForDelete()
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
    }
}