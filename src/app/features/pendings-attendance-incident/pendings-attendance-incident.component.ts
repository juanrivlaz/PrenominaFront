import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal, ViewEncapsulation, WritableSignal } from '@angular/core';
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
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import dayjs from 'dayjs';

@Component({
  selector: 'app-pendings-attendamce-incident',
  imports: [CommonModule, MaterialModule, AvatarComponent, MatTableModule, MatTooltip, ReactiveFormsModule, MatDatepickerModule, MatNativeDateModule],
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
  private allRequests: WritableSignal<Array<IEmployeeAbsenceRequests>> = signal([]);
  public readonly statusPending = AbsenceRequestStatus.Pending;
  public readonly statusApproved = AbsenceRequestStatus.Approved;
  public readonly statusRejected = AbsenceRequestStatus.Rejected;
  public statusFilter: WritableSignal<AbsenceRequestStatus | -1> = signal(-1);
  public dateRange = new FormGroup({
    start: new FormControl<Date | null>(null),
    end: new FormControl<Date | null>(null),
  });
  public searchControl = new FormControl('');
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
    this.dateRange.valueChanges.subscribe(() => this.applyFilters());
    this.searchControl.valueChanges.subscribe(() => this.applyFilters());
  }

  public setStatusFilter(status: AbsenceRequestStatus | -1): void {
    this.statusFilter.set(status);
    this.applyFilters();
  }

  private applyFilters(): void {
    const all = this.allRequests();
    const status = this.statusFilter();
    const start = this.dateRange.value.start;
    const end = this.dateRange.value.end;
    const search = (this.searchControl.value || '').toLowerCase();

    this.dataSource.data = all.filter((item) => {
      if (status !== -1 && item.status !== status) return false;
      if (start && dayjs(item.endDate).isBefore(dayjs(start), 'day')) return false;
      if (end && dayjs(item.startDate).isAfter(dayjs(end), 'day')) return false;
      if (search && !`${item.employeeName} ${item.employeeCode} ${item.incidentDescription}`.toLowerCase().includes(search)) return false;
      return true;
    });
  }

  private get() {
    this.configService.setLoading(true);
    this.service.get().pipe(finalize(() => {
        this.configService.setLoading(false);
    })).subscribe({
      next: (data) => {
        const enriched = data.map((item) => ({
            ...item,
            statusLabel: item.status === AbsenceRequestStatus.Pending ? 'Pendiente' : item.status === AbsenceRequestStatus.Approved ? 'Aprobada' : 'Rechazada',
            sortNote: item.notes ? `${item.notes.slice(0, 20)}...` : '',
        }));
        this.allRequests.set(enriched);
        this.applyFilters();
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
      next: (response) => {
        const blob = response.body!;
        const contentDisposition = response.headers.get('Content-Disposition') || '';
        const match = /filename="?([^";]+)"?/i.exec(contentDisposition);
        const fileName = match?.[1] || `Solicitud_${id}.pdf`;

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
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
