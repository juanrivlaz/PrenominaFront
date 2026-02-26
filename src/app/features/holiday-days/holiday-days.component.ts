import { CommonModule } from "@angular/common";
import { Component, inject, OnDestroy, OnInit, signal, ViewEncapsulation, WritableSignal } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { MaterialModule } from "@shared/modules/material/material.module";
import { CreateHolidayComponent } from "./create-holiday/create-holiday.component";
import { ICreateHoliday } from "./create-holiday/create-holiday.interface";
import { Holiday } from "@core/models/holiday";
import { HolidayDaysService } from "./holiday-days.service";
import { finalize, forkJoin, Subscription } from "rxjs";
import { MatSnackBar } from "@angular/material/snack-bar";
import { IDayOffs } from "@core/models/day-offs.interface";
import { MatMenuModule } from "@angular/material/menu";
import { IFormHoliday } from "./create-holiday/form-holiday.interface";
import { IIncidentCode } from "@core/models/incident-code.interface";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatTableDataSource, MatTableModule } from "@angular/material/table";
import dayjs from "dayjs";
import { DialogConfirmComponent } from "@shared/components/dialog-confirm/dialog-confirm.component";
import { IDialogConfirm } from "@shared/components/dialog-confirm/dialog-confirm.interface";

@Component({
    selector: 'app-holiday-days',
    imports: [
        CommonModule,
        MaterialModule,
        MatMenuModule,
        MatProgressSpinnerModule,
        MatTableModule
    ],
    providers: [HolidayDaysService],
    templateUrl: './holiday-days.component.html',
    styleUrl: './holiday-days.component.scss',
    encapsulation: ViewEncapsulation.None
})
export class HolidayDaysComponent implements OnInit, OnDestroy {
    private readonly dialog = inject(MatDialog);
    private readonly snackBar = inject(MatSnackBar);
    private restSub?: Subscription;
    public loading: WritableSignal<boolean> = signal(true);
    public dayoffs: MatTableDataSource<IDayOffs> = new MatTableDataSource<IDayOffs>([]);
    public listIncidentCode: WritableSignal<Array<IIncidentCode>> = signal([]);
    public loadingItems: WritableSignal<Array<string>> = signal([]);
    public columns: Array<string> = [
        'date',
        'description',
        'domincal',
        'sindicato',
        'incidentCode',
        'actions'
    ];

    constructor(private readonly service: HolidayDaysService) {}

    ngOnInit(): void {
        this.get();
    }

    ngOnDestroy(): void {
        this.restSub?.unsubscribe();
    }

    public createHoliday(): void {
        const dialogRef = this.dialog.open<CreateHolidayComponent, ICreateHoliday, IFormHoliday>(CreateHolidayComponent, {
            data: {
                incidentCodes: this.listIncidentCode(),
            }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.createHoliDay(result);
            }
        });
    }

    public editHoliday(dayoff: IDayOffs): void {
        const dialogRef = this.dialog.open<CreateHolidayComponent, ICreateHoliday, IFormHoliday>(CreateHolidayComponent, {
            data: {
                holiday: {
                    id: dayoff.id,
                    date: dayoff.date,
                    dominical: dayoff.isSunday,
                    isUnion: dayoff.isUnion,
                    description: dayoff.description,
                    incidentCode: dayoff.incidentCode
                },
                incidentCodes: this.listIncidentCode()
            },
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.editHoliDay({
                    date: result.date,
                    description: result.description,
                    isUnion: result.isUnion,
                    incidentCode: result.incidentCode,
                    id: dayoff.id
                });
            }
        });
    }

    public deleteDayOff(dayoff: IDayOffs): void {
        const confirmRef = this.dialog.open<DialogConfirmComponent, IDialogConfirm, boolean>(DialogConfirmComponent, {
            data: {
                title: 'Eliminar día festivo',
                message: `¿Estás seguro de que deseas eliminar el día festivo del ${dayjs(dayoff.date).format('D [de] MMMM')}?`,
                confirmText: 'Eliminar',
                cancelText: 'Cancelar'
            }
        });

        confirmRef.afterClosed().subscribe(result => {
            if (result) {
                this.confirmDelete(dayoff);
            }
        });
    }

    public confirmDelete(dayoff: IDayOffs): void {
        this.loadingItems.update((values) => [...values, dayoff.id]);
        this.service.deleteItem(dayoff.id).pipe(finalize(() => {
            this.loadingItems.update((values) => values.filter((item) => item !== dayoff.id));
        })).subscribe({
            next: (response) => {
                this.dayoffs = new MatTableDataSource(this.dayoffs.data.filter((item) => item.id !== response.id));
            },
            error: (err) => {
                const message = err.error?.message || 'Ocurrió un error, por favor intentalo más tarde';

                this.snackBar.open(message, '❌', {
                  horizontalPosition: 'center',
                  verticalPosition: 'top',
                  panelClass: 'alert-error',
                  duration: 3000
                });
            }
        });
    }

    public isLoding(dayoff: IDayOffs): boolean {
        return this.loadingItems().findIndex((item) => item === dayoff.id) >= 0;
    }

    private get(): void {
        this.loading.set(true);

        this.restSub = forkJoin({
            dayoffs: this.service.get(),
            incidentCodes: this.service.getIncidents(),
        }).pipe(finalize(() => {
            this.loading.set(false);
        })).subscribe({
            next: (response) => {
                this.dayoffs = new MatTableDataSource(response.dayoffs.sort((a, b) => a.isSunday !== b.isSunday ? (a.isSunday ? -1 : 1) : dayjs(a.date).format('MMDD').localeCompare(dayjs(b.date).format('MMDD'))));
                this.listIncidentCode.set(response.incidentCodes);
            },
            error: (err) => {
                const message = err.error?.message || 'Ocurrió un error, por favor intentalo más tarde';

                this.snackBar.open(message, '❌', {
                  horizontalPosition: 'center',
                  verticalPosition: 'top',
                  panelClass: 'alert-error',
                  duration: 3000
                });
            }
        });
    }

    private createHoliDay(form: IFormHoliday): void {
        this.loading.set(true);
        this.service.submitCreate(form).pipe(finalize(() => {
            this.loading.set(false);
        })).subscribe({
            next: (response) => {
                this.dayoffs = new MatTableDataSource([...this.dayoffs.data, response].sort((a, b) => a.isSunday !== b.isSunday ? (a.isSunday ? -1 : 1) : dayjs(a.date).format('MMDD').localeCompare(dayjs(b.date).format('MMDD'))));
            },
            error: (err) => {
                const message = err.error?.message || 'Ocurrió un error, por favor intentalo más tarde';

                this.snackBar.open(message, '❌', {
                  horizontalPosition: 'center',
                  verticalPosition: 'top',
                  panelClass: 'alert-error',
                  duration: 3000
                });
            }
        })
    }

    private editHoliDay(form: IFormHoliday & { id: string }): void {
        this.loading.set(true);
        this.service.submitEdit(form).pipe(finalize(() => {
            this.loading.set(false);
        })).subscribe({
            next: (response) => {
                this.dayoffs = new MatTableDataSource(this.dayoffs.data.map((item) => item.id === response.id ? response : item).sort((a, b) => a.isSunday !== b.isSunday ? (a.isSunday ? -1 : 1) : dayjs(a.date).format('MMDD').localeCompare(dayjs(b.date).format('MMDD'))));
            },
            error: (err) => {
                const message = err.error?.message || 'Ocurrió un error, por favor intentalo más tarde';

                this.snackBar.open(message, '❌', {
                  horizontalPosition: 'center',
                  verticalPosition: 'top',
                  panelClass: 'alert-error',
                  duration: 3000
                });
            }
        })
    }
}