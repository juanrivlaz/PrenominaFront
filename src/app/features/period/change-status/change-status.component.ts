import { CommonModule } from "@angular/common";
import { Component, inject, ViewEncapsulation } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogContent, MatDialogRef, MatDialogTitle } from "@angular/material/dialog";
import { MatProgressSpinner } from "@angular/material/progress-spinner";
import { IPrenominaPeriod } from "@core/models/prenomina-period.interface";
import { IChangeStatus } from "./change-status.interface";
import { finalize } from "rxjs";
import { IChangeStatusOutput } from "./change-status-output.interface";

@Component({
    selector: 'app-change-status',
    imports: [
      CommonModule,
      MatDialogTitle,
      MatDialogContent,
      MatDialogActions,
      MatButtonModule,
      MatProgressSpinner
    ],
    templateUrl: './change-status.component.html',
    styleUrl: './change-status.component.scss',
    encapsulation: ViewEncapsulation.None
})
export class ChangeStatusComponent {
  private readonly dialogRef = inject(MatDialogRef<ChangeStatusComponent, IChangeStatusOutput>);
  public readonly data = inject<IChangeStatus>(MAT_DIALOG_DATA);
  public loading: boolean = false;

  constructor() {
    this.dialogRef.disableClose = true;
  }

  public closeDialog(result: boolean): void {
    this.dialogRef.close({
      confirm: result
    });
  }

  public changeStatus(): void {
    this.loading = true;

    this.data.service.changeActive(this.data.id, !this.data.isActive).pipe(finalize(() => {
      this.loading = false;
    })).subscribe({
      next: (response) => {
        this.dialogRef.close({
          confirm: response
        });
      },
      error: (err) => {
        const message = err.error?.message || 'Ocurrió un error, por favor intentalo más tarde';

        this.dialogRef.close({
          confirm: false,
          errorMessage: message
        });
      }
    });
  }
}