import { CommonModule } from "@angular/common";
import { Component, inject, ViewEncapsulation } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogContent, MatDialogRef, MatDialogTitle } from "@angular/material/dialog";
import { MatProgressSpinner } from "@angular/material/progress-spinner";
import { IPrenominaPeriod } from "@core/models/prenomina-period.interface";

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
  private readonly dialogRef = inject(MatDialogRef<ChangeStatusComponent>);
  public readonly data = inject<IPrenominaPeriod>(MAT_DIALOG_DATA);
  public loading: boolean = false;

  constructor() {
    this.dialogRef.disableClose = true;
  }

  public closeDialog(result: boolean): void {
    this.dialogRef.close(result);
  }

  public changeStatus(): void {
    this.loading = true;

    setTimeout(() => {
      this.loading = false;
      this.closeDialog(true);
    }, 2000);
  }
}