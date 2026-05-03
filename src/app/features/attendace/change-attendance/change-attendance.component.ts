import { CommonModule } from "@angular/common";
import { Component, inject, ViewEncapsulation } from "@angular/core";
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { MAT_DIALOG_DATA, MatDialog, MatDialogActions, MatDialogContent, MatDialogRef, MatDialogTitle } from "@angular/material/dialog";
import { MaterialModule } from "@shared/modules/material/material.module";
import { IChangeAttendance } from "./change-attendance.interface";
import dayjs from "dayjs";
import { MatDividerModule } from "@angular/material/divider";
import { AvatarComponent } from "@shared/components/avatar/avatar.component";
import { createAttendanceValidator } from "@core/validators/validate-attendance.validator";
import { finalize } from "rxjs";
import { IChangeAttendanceResponse } from "./change-attendance-response.interface";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { ConfirmDialogComponent, ConfirmDialogData } from "@shared/components/confirm-dialog/confirm-dialog.component";

@Component({
  selector: 'app-change-attendance',
  templateUrl: './change-attendance.component.html',
  styleUrl: './change-attendance.component.scss',
  encapsulation: ViewEncapsulation.None,
  imports: [
    CommonModule,
    MaterialModule,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    ReactiveFormsModule,
    MatDividerModule,
    AvatarComponent,
    MatProgressSpinnerModule
  ]
})
export class ChangeAttendanceComponent {
  private readonly dialogRef = inject(MatDialogRef<ChangeAttendanceComponent, IChangeAttendanceResponse>);
  private readonly dialog = inject(MatDialog);
  public readonly data = inject<IChangeAttendance>(MAT_DIALOG_DATA);
  public formGroup: FormGroup;
  public loading = false;

  public get canDelete(): boolean {
    return !!(this.data.checkEntryId || this.data.checkOutId);
  }

  constructor() {
    this.dialogRef.disableClose = true;
    const { date, checkEntry, checkOut } = this.data;
    const formattedCheckEntry = checkEntry ? dayjs(`${date} ${checkEntry}`).format('HH:mm') : '';
    const formattedCheckOut = checkOut ? dayjs(`${date} ${checkOut}`).format('HH:mm') : '';

    this.formGroup = new FormGroup({
      checkEntry: new FormControl(formattedCheckEntry, {
        validators: [Validators.required]
      }),
      checkOut: new FormControl(formattedCheckOut, {
        validators: [Validators.required]
      }),
    }, {
      validators: [createAttendanceValidator(this.data.isNightShift)]
    });
  }

  public cancel(): void {
    this.dialogRef.close({
      confirm: false
    });
  }

  public confirm(): void {
    this.loading = true;
    this.data.service.changeAttendance({
      employeeCode: this.data.employeeId,
      checkEntry: this.formGroup.get('checkEntry')?.value,
      checkEntryId: this.data.checkEntryId || null,
      checkOut: this.formGroup.get('checkOut')?.value,
      checkOutId: this.data.checkOutId || null,
      date: dayjs(this.data.date).format("YYYY-MM-DD"),
    }).pipe(finalize(() => {
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

  public delete(): void {
    const confirmRef = this.dialog.open<ConfirmDialogComponent, ConfirmDialogData, boolean>(ConfirmDialogComponent, {
      width: '420px',
      data: {
        title: 'Eliminar checadas',
        message: '¿Estás seguro de eliminar las checadas de este día? Esta acción no se puede deshacer desde la interfaz.',
        confirmText: 'Eliminar',
        cancelText: 'Cancelar',
        confirmColor: 'warn',
      }
    });

    confirmRef.afterClosed().subscribe((accepted) => {
      if (!accepted) return;

      this.loading = true;
      this.data.service.deleteCheckins({
        checkEntryId: this.data.checkEntryId || null,
        checkOutId: this.data.checkOutId || null,
      }).pipe(finalize(() => {
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
    });
  }
}