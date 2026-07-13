import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit, signal, ViewEncapsulation, WritableSignal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AvatarComponent } from '@shared/components/avatar/avatar.component';
import { MaterialModule } from '@shared/modules/material/material.module';
import { ConfirmActionComponent } from './confirm-action/confirm-action.component';
import { IConfirmAction, IConfirmActionResult } from './confirm-action/confirm-action.interface';
import { AbsenceRequestDetailComponent } from './absence-request-detail/absence-request-detail.component';
import { IEmployeeAbsenceRequestDetail } from '@core/models/pendings-attendance-incident/employee-absence-request-detail.interface';
import { OvertimePaymentDetailComponent } from './overtime-payment-detail/overtime-payment-detail.component';
import { IOvertimePaymentRequest, IOvertimePaymentRequestDetail } from '@core/models/pendings-attendance-incident/overtime-payment-request.interface';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { IEmployeeAbsenceRequests } from '@core/models/pendings-attendance-incident/employee-absence-requests.interface';
import { IPendingIncidenceApproval, IPendingIncidenceRow } from '@core/models/pendings-attendance-incident/pending-incidence-approval.interface';
import { PendingsAttendanceIncidentService } from './pendings-attendance-incident.service';
import { AppConfigService } from '@core/services/app-config/app-config.service';
import { AuthService } from '@core/services/auth/auth.service';
import { finalize, skip, Subject, takeUntil } from 'rxjs';
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
export class PendingsAttendanceIncidentComponent implements OnInit, OnDestroy {
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroy$ = new Subject<void>();
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
    'approvals',
    'status',
    'createdAt',
    'actions',
  ];

  // Active view: absence requests (permits), incidences, or overtime payment papeletas.
  public view: WritableSignal<'requests' | 'incidences' | 'overtimePayments'> = signal('requests');
  public overtimePaymentsDataSource: MatTableDataSource<IOvertimePaymentRequest> =
    new MatTableDataSource<IOvertimePaymentRequest>([]);
  public overtimePaymentColumns: Array<string> = [
    'employee',
    'totalMinutes',
    'approvals',
    'status',
    'createdAt',
    'actions',
  ];
  public incidencesDataSource: MatTableDataSource<IPendingIncidenceRow> =
    new MatTableDataSource<IPendingIncidenceRow>([]);
  // Status filter for the "Incidences to approve" tab (Pending by default).
  public incidenceStatusFilter: WritableSignal<AbsenceRequestStatus | -1> = signal(AbsenceRequestStatus.Pending);
  public incidenceColumns: Array<string> = [
    'expand',
    'employee',
    'incidentCode',
    'date',
    'notes',
    'progress',
    'createdAt',
    'actions',
  ];

  constructor(
    private readonly service: PendingsAttendanceIncidentService,
    private readonly configService: AppConfigService,
    private readonly authService: AuthService,
) {}

  ngOnInit(): void {
    this.get();
    this.dateRange.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => this.applyFilters());
    this.searchControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => this.applyFilters());

    // Al cambiar el centro seleccionado (header "tenant"), recargar la vista activa.
    // skip(1) evita la doble carga con la emisión inicial del BehaviorSubject.
    this.authService.activeTenant
      .pipe(skip(1), takeUntil(this.destroy$))
      .subscribe(() => this.refreshActiveView());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Recarga los datos de la pestaña actualmente visible.
  private refreshActiveView(): void {
    switch (this.view()) {
      case 'incidences':
        this.getPendingIncidences();
        break;
      case 'overtimePayments':
        this.getOvertimePayments();
        break;
      default:
        this.get();
        break;
    }
  }

  public setView(view: 'requests' | 'incidences' | 'overtimePayments'): void {
    this.view.set(view);
    // Always refresh when opening the tab to avoid showing a cached list
    // (e.g. when a new incidence was registered after the first load).
    if (view === 'incidences') {
      this.getPendingIncidences();
    } else if (view === 'overtimePayments') {
      this.getOvertimePayments();
    }
  }

  private getOvertimePayments(): void {
    this.configService.setLoading(true);
    this.service.getOvertimePayments().pipe(finalize(() => {
      this.configService.setLoading(false);
    })).subscribe({
      next: (data) => { this.overtimePaymentsDataSource.data = data; },
      error: (err) => {
        const message = err?.error?.message || 'Error al obtener las papeletas de pago de horas extras';
        this.snackBar.open(message, '❌', { horizontalPosition: 'center', verticalPosition: 'top', panelClass: 'alert-error', duration: 3000 });
      },
    });
  }

  public openOvertimePaymentDetail(row: IOvertimePaymentRequest): void {
    this.configService.setLoading(true);
    this.service.getOvertimePaymentDetail(row.id).pipe(finalize(() => {
      this.configService.setLoading(false);
    })).subscribe({
      next: (detail) => {
        const dialogRef = this.dialog.open<OvertimePaymentDetailComponent, IOvertimePaymentRequestDetail, string>(
          OvertimePaymentDetailComponent,
          { data: detail, autoFocus: false, maxWidth: '95vw' },
        );
        dialogRef.afterClosed().subscribe((action) => {
          if (action === 'reresolve') {
            this.service.reResolveOvertimePayment(row.id).pipe(finalize(() => this.configService.setLoading(false))).subscribe({
              next: () => { this.openOvertimePaymentDetail(row); this.getOvertimePayments(); },
              error: () => this.snackBar.open('No se pudo re-resolver la cadena', '❌', { horizontalPosition: 'center', verticalPosition: 'top', panelClass: 'alert-error', duration: 3000 }),
            });
          }
        });
      },
      error: (err) => {
        const message = err?.error?.message || 'Error al obtener el detalle de la papeleta';
        this.snackBar.open(message, '❌', { horizontalPosition: 'center', verticalPosition: 'top', panelClass: 'alert-error', duration: 3000 });
      },
    });
  }

  public downloadOvertimePaymentPdf(row: IOvertimePaymentRequest): void {
    this.configService.setLoading(true);
    this.service.downloadOvertimePayment(row.id).pipe(finalize(() => {
      this.configService.setLoading(false);
    })).subscribe({
      next: (response) => {
        const blob = response.body!;
        const contentDisposition = response.headers.get('Content-Disposition') || '';
        const match = /filename="?([^";]+)"?/i.exec(contentDisposition);
        const fileName = match?.[1] || `PagoHorasExtra_${row.id}.pdf`;

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        const message = err?.error?.message || 'Error al descargar la papeleta';
        this.snackBar.open(message, '❌', { horizontalPosition: 'center', verticalPosition: 'top', panelClass: 'alert-error', duration: 3000 });
      },
    });
  }

  public handleOvertimePaymentAction(approve: boolean, row: IOvertimePaymentRequest): void {
    const dialogRef = this.dialog.open<ConfirmActionComponent, IConfirmAction, IConfirmActionResult>(ConfirmActionComponent, {
      data: {
        type: approve ? 'Aprobar' : 'Rechazar',
        name: row.employeeName,
        incident: 'Pago de horas extras',
        date: row.totalMinutesFormatted,
        note: row.notes || 'Sin notas',
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (!result) { return; }

      this.configService.setLoading(true);
      const request$ = approve
        ? this.service.approveOvertimePayment(row.id)
        : this.service.rejectOvertimePayment(row.id, result.comment);

      request$.pipe(finalize(() => this.configService.setLoading(false))).subscribe({
        next: () => {
          this.snackBar.open(`Papeleta ${approve ? 'aprobada' : 'rechazada'} correctamente`, '✅', { horizontalPosition: 'center', verticalPosition: 'top', panelClass: 'alert-success', duration: 3000 });
          this.getOvertimePayments();
        },
        error: (err) => {
          const message = err?.error?.message || `Error al ${approve ? 'aprobar' : 'rechazar'} la papeleta`;
          this.snackBar.open(message, '❌', { horizontalPosition: 'center', verticalPosition: 'top', panelClass: 'alert-error', duration: 3000 });
        },
      });
    });
  }

  public setIncidenceStatusFilter(status: AbsenceRequestStatus | -1): void {
    this.incidenceStatusFilter.set(status);
    this.getPendingIncidences();
  }

  private getPendingIncidences(): void {
    this.configService.setLoading(true);
    this.service.getPendingIncidences(this.incidenceStatusFilter()).pipe(finalize(() => {
      this.configService.setLoading(false);
    })).subscribe({
      next: (data) => {
        this.incidencesDataSource.data = this.buildIncidenceRows(data);
      },
      error: (err) => {
        const message = err?.error?.message || 'Error al obtener las incidencias por aprobar';
        this.snackBar.open(message, '❌', {
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: 'alert-error',
          duration: 3000,
        });
      },
    });
  }

  public handleIncidenceAction(approve: boolean, item: IPendingIncidenceApproval): void {
    const dialogRef = this.dialog.open<ConfirmActionComponent, IConfirmAction, IConfirmActionResult>(
      ConfirmActionComponent,
      {
        data: {
          type: approve ? 'Aprobar' : 'Rechazar',
          name: item.employeeName,
          incident: `${item.incidentCode} | ${item.incidentDescription}`,
          date: dayjs(item.date).format('DD/MM/YYYY'),
          note: item.notes || 'Sin notas',
        },
      },
    );

    dialogRef.afterClosed().subscribe((result) => {
      if (!result) {
        return;
      }

      this.configService.setLoading(true);
      const request$ = approve
        ? this.service.approveIncidence(item.id)
        : this.service.rejectIncidence(item.id, result.comment);

      request$.pipe(finalize(() => {
        this.configService.setLoading(false);
      })).subscribe({
        next: () => {
          this.snackBar.open(
            `Incidencia ${approve ? 'aprobada' : 'rechazada'} correctamente`,
            '✅',
            {
              horizontalPosition: 'center',
              verticalPosition: 'top',
              panelClass: 'alert-success',
              duration: 3000,
            },
          );
          this.getPendingIncidences();
        },
        error: (err) => {
          const message = err?.error?.message || `Error al ${approve ? 'aprobar' : 'rechazar'} la incidencia`;
          this.snackBar.open(message, '❌', {
            horizontalPosition: 'center',
            verticalPosition: 'top',
            panelClass: 'alert-error',
            duration: 3000,
          });
        },
      });
    });
  }

  // Groups incidences by requestGroupId (multi-day permits registered together
  // from the permits menu) so they can be approved/rejected as a group.
  private buildIncidenceRows(items: Array<IPendingIncidenceApproval>): Array<IPendingIncidenceRow> {
    const groups = new Map<string, Array<IPendingIncidenceApproval>>();
    const rows: Array<IPendingIncidenceRow> = [];

    for (const item of items) {
      if (item.requestGroupId) {
        const arr = groups.get(item.requestGroupId) ?? [];
        arr.push(item);
        groups.set(item.requestGroupId, arr);
      } else {
        rows.push(this.toSingleRow(item));
      }
    }

    // A group with a single remaining day is shown as an individual row.
    for (const [groupId, arr] of groups) {
      rows.push(arr.length > 1 ? this.toGroupRow(groupId, arr) : this.toSingleRow(arr[0]));
    }

    return rows.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  }

  private toSingleRow(item: IPendingIncidenceApproval): IPendingIncidenceRow {
    return {
      key: item.id,
      isGroup: false,
      requestGroupId: item.requestGroupId,
      employeeCode: item.employeeCode,
      employeeName: item.employeeName,
      incidentCode: item.incidentCode,
      incidentDescription: item.incidentDescription,
      notes: item.notes,
      createdAt: item.createdAt,
      startDate: item.date,
      endDate: item.date,
      daysCount: 1,
      totalApprovers: item.totalApprovers,
      approvedCount: item.approvedCount,
      alreadyApprovedByMe: item.alreadyApprovedByMe,
      approved: item.approved,
      rejected: item.rejected,
      items: [item],
      expanded: false,
    };
  }

  private toGroupRow(groupId: string, items: Array<IPendingIncidenceApproval>): IPendingIncidenceRow {
    const sorted = [...items].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const first = sorted[0];

    return {
      key: groupId,
      isGroup: true,
      requestGroupId: groupId,
      employeeCode: first.employeeCode,
      employeeName: first.employeeName,
      incidentCode: first.incidentCode,
      incidentDescription: first.incidentDescription,
      notes: first.notes,
      createdAt: first.createdAt,
      startDate: sorted[0].date,
      endDate: sorted[sorted.length - 1].date,
      daysCount: sorted.length,
      // Representative progress: the minimum approvals of the group over the required total.
      totalApprovers: first.totalApprovers,
      approvedCount: Math.min(...sorted.map((i) => i.approvedCount)),
      alreadyApprovedByMe: sorted.every((i) => i.alreadyApprovedByMe || i.approved),
      approved: sorted.every((i) => i.approved),
      rejected: sorted.some((i) => i.rejected),
      items: sorted,
      expanded: false,
    };
  }

  public toggleIncidenceExpand(row: IPendingIncidenceRow): void {
    row.expanded = !row.expanded;
  }

  // Approves or rejects a row. If it's a group (multi-day permit) it acts on the whole
  // group; if it's individual it delegates to the single-incidence flow.
  public handleIncidenceRowAction(approve: boolean, row: IPendingIncidenceRow): void {
    if (!row.isGroup || !row.requestGroupId) {
      this.handleIncidenceAction(approve, row.items[0]);
      return;
    }

    const dialogRef = this.dialog.open<ConfirmActionComponent, IConfirmAction, IConfirmActionResult>(
      ConfirmActionComponent,
      {
        data: {
          type: approve ? 'Aprobar' : 'Rechazar',
          name: row.employeeName,
          incident: `${row.incidentCode} | ${row.incidentDescription}`,
          date: `${dayjs(row.startDate).format('DD/MM/YYYY')} - ${dayjs(row.endDate).format('DD/MM/YYYY')} (${row.daysCount} días)`,
          note: row.notes || 'Sin notas',
        },
      },
    );

    dialogRef.afterClosed().subscribe((result) => {
      if (!result) {
        return;
      }

      this.configService.setLoading(true);
      const request$ = approve
        ? this.service.approveIncidenceGroup(row.requestGroupId!)
        : this.service.rejectIncidenceGroup(row.requestGroupId!, result.comment);

      request$.pipe(finalize(() => {
        this.configService.setLoading(false);
      })).subscribe({
        next: () => {
          this.snackBar.open(
            `Permiso ${approve ? 'aprobado' : 'rechazado'} correctamente`,
            '✅',
            { horizontalPosition: 'center', verticalPosition: 'top', panelClass: 'alert-success', duration: 3000 },
          );
          this.getPendingIncidences();
        },
        error: (err) => {
          const message = err?.error?.message || `Error al ${approve ? 'aprobar' : 'rechazar'} el permiso`;
          this.snackBar.open(message, '❌', { horizontalPosition: 'center', verticalPosition: 'top', panelClass: 'alert-error', duration: 3000 });
        },
      });
    });
  }

  // Opens a read-only modal with the full request information: days, accumulated
  // overtime consumed per day, comment and approval progress.
  public openDetail(request: IEmployeeAbsenceRequests): void {
    this.configService.setLoading(true);
    this.service.getDetail(request.id).pipe(finalize(() => {
      this.configService.setLoading(false);
    })).subscribe({
      next: (detail: IEmployeeAbsenceRequestDetail) => {
        const dialogRef = this.dialog.open<AbsenceRequestDetailComponent, IEmployeeAbsenceRequestDetail, string>(
          AbsenceRequestDetailComponent,
          { data: detail, autoFocus: false, maxWidth: '95vw' },
        );

        dialogRef.afterClosed().subscribe((action) => {
          if (action === 'reresolve') {
            this.reResolveChain(request);
          }
        });
      },
      error: (err) => {
        const message = err?.error?.message || 'Error al obtener el detalle de la solicitud';
        this.snackBar.open(message, '❌', {
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: 'alert-error',
          duration: 3000,
        });
      },
    });
  }

  // Recalcula los candidatos de la cadena (tras corregir asignaciones) y reabre el detalle.
  private reResolveChain(request: IEmployeeAbsenceRequests): void {
    this.configService.setLoading(true);
    this.service.reResolveChain(request.id).pipe(finalize(() => {
      this.configService.setLoading(false);
    })).subscribe({
      next: (result) => {
        this.snackBar.open(result.message, '✅', {
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: 'alert-success',
          duration: 3000,
        });
        this.openDetail(request);
      },
      error: (err) => {
        const message = err?.error?.message || 'No se pudo re-resolver la cadena de firmas';
        this.snackBar.open(message, '❌', {
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: 'alert-error',
          duration: 3000,
        });
      },
    });
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
    const dialogRef = this.dialog.open<ConfirmActionComponent, IConfirmAction, IConfirmActionResult>(
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
          result.comment,
        ).pipe(finalize(() => {
            this.configService.setLoading(false);
        })).subscribe({
          next: () => {
            // With multi-approval, an approval can be partial (other approvers are still pending).
            const partial = approve && item.requiresApproval && (item.approvedCount + 1) < item.totalApprovers;
            const message = partial
              ? 'Tu aprobación se registró. Faltan aprobaciones de otros responsables.'
              : `Solicitud ${approve ? 'aprobada' : 'rechazada'} correctamente`;

            this.snackBar.open(message, '✅', {
              horizontalPosition: 'center',
              verticalPosition: 'top',
              panelClass: 'alert-success',
              duration: 3500,
            });

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
