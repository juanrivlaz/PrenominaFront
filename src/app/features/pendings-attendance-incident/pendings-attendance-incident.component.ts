import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, ViewEncapsulation } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AvatarComponent } from '@shared/components/avatar/avatar.component';
import { MaterialModule } from '@shared/modules/material/material.module';
import { ConfirmActionComponent } from './confirm-action/confirm-action.component';
import { IConfirmAction } from './confirm-action/confirm-action.interface';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { IEmployeeAbsenceRequests } from '@core/models/pendings-attendance-incident/employee-absence-requests.interface';
import { PendingsAttendanceIncidentService } from './pendings-attendance-incident.service';
import { AppConfigService } from '@core/services/app-config/app-config.service';
import { finalize } from 'rxjs';
import { AbsenceRequestStatus } from '@core/models/enum/absence-request-status';
import { MatTooltip } from "@angular/material/tooltip";
import dayjs from 'dayjs';

@Component({
  selector: 'app-pendings-attendamce-incident',
  imports: [CommonModule, MaterialModule, AvatarComponent, MatTableModule, MatTooltip],
  providers: [PendingsAttendanceIncidentService],
  templateUrl: './pendings-attendance-incident.component.html',
  styleUrl: './pendings-attendance-incident.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class PendingsAttendanceIncidentComponent implements OnInit {
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  public dataSource: MatTableDataSource<IEmployeeAbsenceRequests> =
    new MatTableDataSource<IEmployeeAbsenceRequests>([]);
  public readonly statusPending = AbsenceRequestStatus.Pending;
  public readonly statusApproved = AbsenceRequestStatus.Approved;
  public readonly statusRejected = AbsenceRequestStatus.Rejected;
  public columns: Array<string> = [
    'employee',
    'incidentCode',
    'startDate',
    'endDate',
    'notes',
    'status',
    'createdAt',
    'actions',
  ];

  constructor(
    private readonly service: PendingsAttendanceIncidentService,
    private readonly configService: AppConfigService,
) {}

  ngOnInit(): void {
    this.get();
  }

  private get() {
    this.configService.setLoading(true);
    this.service.get().pipe(finalize(() => {
        this.configService.setLoading(false);
    })).subscribe({
      next: (data) => {
        this.dataSource.data = data.map((item) => ({
            ...item,
            statusLabel: item.status === AbsenceRequestStatus.Pending ? 'Pendiente' : item.status === AbsenceRequestStatus.Approved ? 'Aprobada' : 'Rechazada',
            sortNote: item.notes ? `${item.notes.slice(0, 20)}...` : '',
        }));
      },
      error: (err) => {
        const message =
          err?.error?.message || 'Error al obtener las solicitudes pendientes';

        this.snackBar.open(message, '❌', {
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: 'alert-error',
          duration: 3000,
        });
      },
    });
  }

  public handleClickAction(approve: boolean, item: IEmployeeAbsenceRequests): void {
    const dialogRef = this.dialog.open<ConfirmActionComponent, IConfirmAction>(
      ConfirmActionComponent,
      {
        data: {
          type: approve ? 'Aprobar' : 'Rechazar',
          name: item.employeeName,
          incident: `${item.incidentCode} | ${item.incidentDescription}`,
          date: `${dayjs(item.startDate).format('DD/MM/YYYY')} - ${dayjs(item.endDate).format('DD/MM/YYYY')}`,
          note: item.notes || 'Sin notas',
        },
      },
    );

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.configService.setLoading(true);
        this.service.changeStatus(
          item.id,
          approve ? AbsenceRequestStatus.Approved : AbsenceRequestStatus.Rejected,
        ).pipe(finalize(() => {
            this.configService.setLoading(false);
        })).subscribe({
          next: () => {
            this.snackBar.open(
              `Solicitud ${approve ? 'aprobada' : 'rechazada'} correctamente`,
              '✅',
              {
                horizontalPosition: 'center',
                verticalPosition: 'top',
                panelClass: 'alert-success',
                duration: 3000,
              },
            );

            this.get();
          },
          error: (err) => {
            const message =
              err?.error?.message ||
              `Error al ${approve ? 'aprobar' : 'rechazar'} la solicitud`;

            this.snackBar.open(message, '❌', {
              horizontalPosition: 'center',
              verticalPosition: 'top',
              panelClass: 'alert-error',
              duration: 3000,
            });
          },
        });
      }
    });
  }

  public downloadFile(id: string): void {
    this.configService.setLoading(true);
    this.service.download(id).pipe(finalize(() => {
        this.configService.setLoading(false);
    })).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Solicitud_${id}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        const message =
          err?.error?.message || 'Error al descargar el archivo';

        this.snackBar.open(message, '❌', {
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: 'alert-error',
          duration: 3000,
        });
      },
    });
  }
}
