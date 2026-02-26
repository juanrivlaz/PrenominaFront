import { CommonModule } from "@angular/common";
import { Component, inject, OnDestroy, OnInit, signal, ViewEncapsulation, WritableSignal } from "@angular/core";
import { MatMenuModule } from "@angular/material/menu";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MaterialModule } from "../../shared/modules/material/material.module";
import { MatSnackBar } from "@angular/material/snack-bar";
import { finalize, Subscription } from "rxjs";
import { WorkedDayOffService } from "./worked-day-off.service";
import { IWorkedDayOffs } from "@core/models/worked-day-offs.interface";
import { IDayOffs } from "@core/models/day-offs.interface";
import dayjs from "dayjs";
import { MatTableDataSource, MatTableModule } from "@angular/material/table";
import { AppConfigService } from "@core/services/app-config/app-config.service";
import { FormsModule } from "@angular/forms";
import { TypeFileDownload } from "@core/models/enum/type-file-download";

@Component({
    selector: 'app-worked-day-off',
    imports: [
        CommonModule,
        MaterialModule,
        MatMenuModule,
        MatTooltipModule,
        MatTableModule,
        FormsModule
    ],
    providers: [WorkedDayOffService],
    templateUrl: './worked-day-off.component.html',
    styleUrl: './worked-day-off.component.scss',
    encapsulation: ViewEncapsulation.None,
})
export class WorkedDayOffComponent implements OnInit, OnDestroy{
    private readonly snackBar = inject(MatSnackBar);
    private restSub?: Subscription;
    public listWorkedDayOffs: MatTableDataSource<IWorkedDayOffs> = new MatTableDataSource<IWorkedDayOffs>([]);
    public listDayOffs: WritableSignal<Array<IDayOffs>> = signal([]);
    public activeDayOff: WritableSignal<IDayOffs | null> = signal(null);
    public columnTable: Array<string> = [
        'code',
        'name',
        'activity',
        'salary',
        'date',
        'numConcept',
        'hours',
        'amount'
    ];

    constructor(
        private readonly service: WorkedDayOffService,
        private readonly configService: AppConfigService
    ) {}

    ngOnInit(): void {
        this.getDayOffs();
    }

    ngOnDestroy(): void {
        this.restSub?.unsubscribe();
    }

    public get(dayOff: IDayOffs): void {
        this.configService.setLoading(true);
        this.service.getWorkedDays(dayOff.id).pipe(finalize(() => {
            this.configService.setLoading(false);
        })).subscribe({
            next: (response) => {
                this.listWorkedDayOffs = new MatTableDataSource<IWorkedDayOffs>(response.map((item) => ({ ...item, exported: true})));
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

    public setDayOff(dayOff: IDayOffs): void {
        this.activeDayOff.set(dayOff);
        this.get(dayOff);
    }

    public get labelDayOff(): string {
        const item = this.activeDayOff();
        return item ? `${dayjs(item.date).format('D MMMM')} | ${item.description}` : 'Seleccionar Fecha';
    }

    public isActiveDayOff(dayOff: IDayOffs): boolean {
        return dayOff.id === this.activeDayOff()?.id;
    }

    public handleChangeSearch(event: Event): void {
        const filterValue = (event.target as HTMLInputElement).value;
        this.listWorkedDayOffs.filter = filterValue.trim().toLowerCase();
    }

    public downloadWorkedDays(typeFileDownload: number): void {
        const item = this.activeDayOff();

        if (!item) {
            this.snackBar.open('Seleccionar Fecha', '❌', {
                horizontalPosition: 'center',
                verticalPosition: 'top',
                panelClass: 'alert-error',
                duration: 3000
            });

            return;
        }

        this.configService.setLoading(true);
        this.service.downloadWorkedDays(item?.id, typeFileDownload).pipe(finalize(() => {
            this.configService.setLoading(false);
        })).subscribe({
            next: (response) => {
                const urlBlob = window.URL.createObjectURL(new Blob([response]));
                const link = document.createElement('a');
                link.href = urlBlob;
                var type = typeFileDownload === TypeFileDownload.XLSX ? 'xlsx' : 'pdf';
                link.download = `worked-dayoff.${type}`;
                link.click();

                window.URL.revokeObjectURL(urlBlob);
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

    private getDayOffs(): void {
        this.configService.setLoading(true);
        this.restSub = this.service.get().pipe(finalize(() => {
            this.configService.setLoading(false);
        })).subscribe({
            next: (response) => {
                this.listDayOffs.set(response.filter(item => !item.isSunday).sort((a, b) => dayjs(a.date).format('MMDD').localeCompare(dayjs(b.date).format('MMDD'))));
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
}