import { CommonModule } from "@angular/common";
import { Component, inject, model, OnInit, ViewEncapsulation } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogRef, MatDialogTitle } from "@angular/material/dialog";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MaterialModule } from "@shared/modules/material/material.module";
import { ClocksService } from "../clocks.service";
import { IClockUsersModal } from "./clock-users.interface";
import { IClockUser } from "@core/models/clock-user.interface";
import { finalize } from "rxjs";
import { MatTableDataSource, MatTableModule } from "@angular/material/table";
import { SelectionModel } from "@angular/cdk/collections";
import { MatSnackBar } from "@angular/material/snack-bar";

@Component({
    selector: 'app-clock-users',
    imports: [
        CommonModule,
        MaterialModule,
        MatDialogContent,
        MatDialogActions,
        MatDialogClose,
        MatDialogTitle,
        MatProgressSpinnerModule,
        MatTableModule
    ],
    providers: [ ClocksService ],
    templateUrl: './clock-users.component.html',
    styleUrl: './clock-users.component.scss',
    encapsulation: ViewEncapsulation.None
})
export class ClockUsersComponent {
    private readonly _snackBar = inject(MatSnackBar);
    public readonly data = inject<IClockUsersModal>(MAT_DIALOG_DATA);
    public listClockUser: MatTableDataSource<IClockUser> = new MatTableDataSource<IClockUser>([]);
    public columnTable: Array<string> = [
        'select',
        'employeeNumber',
        'name',
        'privilege',
        'password',
        'enable'
    ];
    public selection = new SelectionModel<IClockUser>(true, []);
    public loading = model<boolean>(false);

    constructor(private readonly service: ClocksService) { 
        this.getUser();
    }

    public getUser(): void {
        this.loading.set(true);
        this.service.getClockUser(this.data.id).pipe(finalize(() => {
            this.loading.set(false);
        })).subscribe({
            next: (response) => {
                this.listClockUser = new MatTableDataSource(response);
            },
            error: (err) => {
                console.log({
                    err
                });
            }
        });
    }

    public syncClockUserToBd(): void {
        this.loading.set(true);
        this.service.syncClockUserToDB(this.data.id).pipe(finalize(() => {
            this.loading.set(false);
        })).subscribe({
            next: (response) => {
                this._snackBar.open('Los usuarios se sincronizaron correctamente', '✅', {
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
            }
        });
    }

    public handleChangeSearch(event: Event): void {
        const filterValue = (event.target as HTMLInputElement).value;
        this.listClockUser.filter = filterValue.trim().toLowerCase();
    }

    /** Whether the number of selected elements matches the total number of rows. */
    public isAllSelected() {
        const numSelected = this.selection.selected.length;
        const numRows = this.listClockUser.data.length;
        return numSelected === numRows;
    }

    /** Selects all rows if they are not all selected; otherwise clear selection. */
    public toggleAllRows() {
        if (this.isAllSelected()) {
        this.selection.clear();
        return;
        }

        this.selection.select(...this.listClockUser.data);
    }
}