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

@Component({
    selector: 'app-holiday-days',
    imports: [CommonModule, MaterialModule, MatMenuModule, MatProgressSpinnerModule],
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
    public dayoffs: WritableSignal<Array<IDayOffs>> = signal([]);
    public listIncidentCode: WritableSignal<Array<IIncidentCode>> = signal([]);
    public loadingItems: WritableSignal<Array<string>> = signal([]);

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

    public editHoliday(): void {
        const item = new Holiday('0', new Date(2025, 0, 2), false, false, 'Año nuevo', '10');
        const dialogRef = this.dialog.open<CreateHolidayComponent, ICreateHoliday, IFormHoliday>(CreateHolidayComponent, {
            data: {
                holiday: item,
                incidentCodes: this.listIncidentCode()
            },
        });

        dialogRef.afterClosed().subscribe(result => {
            console.log(result);
        });
    }

    public deleteDayOff(dayoff: IDayOffs): void {
        this.loadingItems.update((values) => [...values, dayoff.id]);
        this.service.deleteItem(dayoff.id).pipe(finalize(() => {
            this.loadingItems.update((values) => values.filter((item) => item !== dayoff.id));
        })).subscribe({
            next: (response) => {
                this.dayoffs.update((values) => values.filter((item) => item.id !== response.id));
            },
            error: (err) => {
                const message = err.error?.message || 'Ocurrió un error, por favor intentalo más tarde';

                this.snackBar.open(message, undefined, {
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
                this.dayoffs.set(response.dayoffs);
                this.listIncidentCode.set(response.incidentCodes);
            },
            error: (err) => {
                const message = err.error?.message || 'Ocurrió un error, por favor intentalo más tarde';

                this.snackBar.open(message, undefined, {
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
                this.dayoffs.set([...this.dayoffs(), response]);
            },
            error: (err) => {
                const message = err.error?.message || 'Ocurrió un error, por favor intentalo más tarde';

                this.snackBar.open(message, undefined, {
                  horizontalPosition: 'center',
                  verticalPosition: 'top',
                  panelClass: 'alert-error',
                  duration: 3000
                });
            }
        })
    }
}