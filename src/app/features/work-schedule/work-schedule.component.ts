import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component, inject, OnDestroy, OnInit, signal, ViewEncapsulation } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { MatListModule } from "@angular/material/list";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { MatSnackBar } from "@angular/material/snack-bar";
import { MaterialModule } from "@shared/modules/material/material.module";
import { IWorkSchedule } from "@core/models/work-schedule.interface";
import { WorkScheduleService } from "./work-schedule.service";
import { Subject, finalize, takeUntil } from "rxjs";
import { WorkScheduleFormComponent } from "./work-schedule-form/work-schedule-form.component";
import { IWorkScheduleFormData } from "./work-schedule-form/work-schedule-form.interface";

@Component({
    selector: 'app-work-schedule',
    imports: [CommonModule, MaterialModule, MatListModule, MatProgressBarModule],
    providers: [WorkScheduleService],
    templateUrl: './work-schedule.component.html',
    styleUrl: './work-schedule.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None
})
export class WorkScheduleComponent implements OnInit, OnDestroy {
    private readonly _snackBar = inject(MatSnackBar);
    private readonly dialog = inject(MatDialog);
    private readonly destroy$ = new Subject<void>();

    public readonly schedules = signal<Array<IWorkSchedule>>([]);
    public readonly loading = signal(false);

    constructor(private readonly service: WorkScheduleService) {}

    ngOnInit(): void {
        this.loadSchedules();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    public openCreate(): void {
        const ref = this.dialog.open<WorkScheduleFormComponent, IWorkScheduleFormData>(WorkScheduleFormComponent, {
            width: '480px',
            data: { mode: 'create' }
        });

        ref.afterClosed().pipe(takeUntil(this.destroy$)).subscribe((result) => {
            if (result) {
                this.loadSchedules();
            }
        });
    }

    public openEdit(item: IWorkSchedule): void {
        const ref = this.dialog.open<WorkScheduleFormComponent, IWorkScheduleFormData>(WorkScheduleFormComponent, {
            width: '480px',
            data: { mode: 'edit', schedule: item }
        });

        ref.afterClosed().pipe(takeUntil(this.destroy$)).subscribe((result) => {
            if (result) {
                this.loadSchedules();
            }
        });
    }

    public deleteSchedule(item: IWorkSchedule): void {
        if (!confirm(`¿Eliminar el horario "${item.label}"?`)) {
            return;
        }

        this.service.delete(item.id).pipe(takeUntil(this.destroy$)).subscribe({
            next: () => {
                this.showSuccess('Horario eliminado');
                this.loadSchedules();
            },
            error: (err) => this.showError(err)
        });
    }

    private loadSchedules(): void {
        this.loading.set(true);
        this.service.list().pipe(
            finalize(() => this.loading.set(false)),
            takeUntil(this.destroy$)
        ).subscribe({
            next: (response) => this.schedules.set(response),
            error: (err) => this.showError(err)
        });
    }

    private showSuccess(message: string): void {
        this._snackBar.open(message, '✅', {
            horizontalPosition: 'center',
            verticalPosition: 'top',
            panelClass: 'alert-success',
            duration: 3000
        });
    }

    private showError(err: any): void {
        const message = err?.error?.message || 'Ocurrió un error, por favor intenta más tarde';
        this._snackBar.open(message, '❌', {
            horizontalPosition: 'center',
            verticalPosition: 'top',
            panelClass: 'alert-error',
            duration: 3000
        });
    }
}
