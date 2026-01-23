import { CommonModule } from "@angular/common";
import { Component, inject, model, OnDestroy, OnInit, ViewEncapsulation } from "@angular/core";
import { MatMenuModule } from "@angular/material/menu";
import { MaterialModule } from "@shared/modules/material/material.module";
import { ContractsService } from "./contracts.service";
import { Contract } from "@core/models/contract";
import { MatSnackBar } from "@angular/material/snack-bar";
import { combineLatest, finalize, Subscription } from "rxjs";
import { AuthService } from "@core/services/auth/auth.service";
import { MatTableDataSource, MatTableModule } from "@angular/material/table";
import { MatSlideToggleChange, MatSlideToggleModule } from "@angular/material/slide-toggle";
import { AppConfigService } from "@core/services/app-config/app-config.service";
import { MatDialog } from "@angular/material/dialog";
import { AddObservationComponent } from "./add-observation/add-observation.component";
import { IAddObservation } from "./add-observation/add-observation.interface";
import { MatTooltipModule } from "@angular/material/tooltip";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";

@Component({
    selector: 'app-contracts',
    imports: [
        CommonModule,
        MaterialModule,
        MatMenuModule,
        MatTableModule,
        MatSlideToggleModule,
        MatTooltipModule,
        FormsModule,
        ReactiveFormsModule
    ],
    providers: [ContractsService],
    templateUrl: './contracts.component.html',
    styleUrl: './contracts.component.scss',
    encapsulation: ViewEncapsulation.None
})
export class ContractsComponent implements OnInit, OnDestroy {
    private readonly _snackBar = inject(MatSnackBar);
    private readonly dialog = inject(MatDialog);
    private contractSub?: Subscription;
    public listContract: MatTableDataSource<Contract> = new MatTableDataSource();
    public columns: Array<string> = [
        'code',
        'name',
        'ocupation',
        'activity',
        'schedule',
        'seniority',
        'initContract',
        'finalContract',
        'days',
        'generateContract'
    ];
    public catalogStatus = {
        all: 'Todos',
        'about-to-expire': 'Por Vencer',
        'expired': 'Vencidos'
    };
    public filterStatus = model<'all' | 'about-to-expire' | 'expired'>('all');
    public search = model<string>('');

    constructor(
        private readonly service: ContractsService,
        private readonly authService: AuthService,
        private readonly configService: AppConfigService
    ) {}

    ngOnInit(): void {
        combineLatest([this.authService.activeCompany, this.authService.activeTenant]).subscribe(() => {
            this.get();
        });
    }

    ngOnDestroy(): void {
        this.contractSub?.unsubscribe();
    }

    public handleChangeFilterStatus(status: 'all' | 'about-to-expire' | 'expired'): void {
        this.filterStatus.set(status);
        this.search.set('');
        const filter = {
            status: status,
            filter: '',
        };
        this.listContract.filter = JSON.stringify(filter);
    }

    public handleChangeSearch(event: Event): void {
        const filterValue = (event.target as HTMLInputElement).value;
        const filter = {
            status: this.filterStatus(),
            filter: filterValue.trim().toLowerCase(),
        };
        this.listContract.filter = JSON.stringify(filter);
    }

    public handleChangeContract(contract: Contract): void {
        const dialogRef = this.dialog.open<AddObservationComponent, IAddObservation, { contract: Contract }>(AddObservationComponent, {
            data: {
                companyId: contract.company,
                employeeCode: contract.codigo,
                folioContract: contract.folio,
                observation: contract.observation,
                generateContract: contract.applyRehired,
                contractDays: contract.contractDays,
                service: this.service,
            },
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result?.contract) {
                const { codigo, company, folio, observation, applyRehired, contractDays } = result.contract;
                this.listContract.data = this.listContract.data.map((item) => {
                    if (item.codigo === codigo && item.company === company && item.folio === folio) {
                        return {
                            ...item,
                            observation,
                            applyRehired,
                            contractDays
                        }
                    }

                    return item;
                });

                this.listContract.data = this.listContract.data;
            }
        });
    }

    public download(): void {
        this.configService.setLoading(true);
        this.service.download().pipe(finalize(() => {
            this.configService.setLoading(false);
        })).subscribe({
            next: (blob) => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'contracts.pdf';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            },
            error: (err) => {
                const message = err.error?.message || 'Ocurrió un error, por favor intentalo más tarde';

                this._snackBar.open(message, undefined, {
                    horizontalPosition: 'center',
                    verticalPosition: 'top',
                    panelClass: 'alert-error',
                    duration: 3000
                });
            }
        });
    }

    private get(): void {
        this.configService.setLoading(true);

        this.contractSub = this.service.get().pipe(finalize(() => {
            this.configService.setLoading(false);
        })).subscribe({
            next: (response) => {
                this.listContract = new MatTableDataSource(response);
                this.listContract.filterPredicate = (data: Contract, filter: string) => {
                    const filtros = JSON.parse(filter);

                    let conditionExpired = true;
                    if (filtros.status === 'about-to-expire') {
                        conditionExpired = data.expireInDays > 1 && data.expireInDays <= 5;
                    } else if (filtros.status === 'expired') {
                        conditionExpired = data.expireInDays <= 1;
                    }

                    const find = filtros.filter.toLowerCase();
                    const conditionalFilter = `${data.lastName} ${data.mLastName} ${data.name}`.toLowerCase().includes(find) ||
                    data.codigo.toString().includes(find) ||
                    (data.activity || '').toLowerCase().includes(find) || (data.ocupation || '').toString().includes(find);

                    return conditionExpired && conditionalFilter;
                }
            },
            error: (err) => {
                const message = err.error?.message || 'Ocurrió un error, por favor intentalo más tarde';

                this._snackBar.open(message, undefined, {
                  horizontalPosition: 'center',
                  verticalPosition: 'top',
                  panelClass: 'alert-error',
                  duration: 3000
                });
            }
        });
    }
}