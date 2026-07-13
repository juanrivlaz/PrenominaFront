import { CommonModule } from "@angular/common";
import { Component, inject, OnInit, signal, ViewEncapsulation, WritableSignal } from "@angular/core";
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatSnackBar } from "@angular/material/snack-bar";
import { MatSelectModule } from "@angular/material/select";
import { MatTableModule } from "@angular/material/table";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatNativeDateModule } from "@angular/material/core";
import { finalize } from "rxjs";
import { MaterialModule } from "@shared/modules/material/material.module";
import { AppConfigService } from "@core/services/app-config/app-config.service";
import dayjs from "dayjs";
import { ApproverDelegationsService, IApproverDelegation, ISimpleUser } from "./approver-delegations.service";

@Component({
    selector: 'app-approver-delegations',
    imports: [CommonModule, MaterialModule, ReactiveFormsModule, MatSelectModule, MatTableModule, MatDatepickerModule, MatNativeDateModule],
    providers: [ApproverDelegationsService],
    templateUrl: './approver-delegations.component.html',
    styleUrl: './approver-delegations.component.scss',
    encapsulation: ViewEncapsulation.None,
})
export class ApproverDelegationsComponent implements OnInit {
    private readonly service = inject(ApproverDelegationsService);
    private readonly configService = inject(AppConfigService);
    private readonly snackBar = inject(MatSnackBar);

    public readonly delegations: WritableSignal<Array<IApproverDelegation>> = signal([]);
    public readonly users: WritableSignal<Array<ISimpleUser>> = signal([]);
    public readonly columns = ['user', 'delegate', 'from', 'to', 'status', 'actions'];

    public form = new FormGroup({
        userId: new FormControl('', { validators: [Validators.required] }),
        delegateUserId: new FormControl('', { validators: [Validators.required] }),
        fromDate: new FormControl<Date | null>(null, { validators: [Validators.required] }),
        toDate: new FormControl<Date | null>(null),
    });

    ngOnInit(): void {
        this.loadUsers();
        // Se difiere para no cambiar `appSettings.loading` (atado al @fadeInOut del
        // AppComponent) dentro del mismo ciclo de detección de cambios -> evita NG0100.
        Promise.resolve().then(() => this.load());
    }

    private loadUsers(): void {
        this.service.getUsers().subscribe({
            next: (data) => this.users.set(data),
            error: () => this.showError('No se pudieron cargar los usuarios'),
        });
    }

    private load(): void {
        this.configService.setLoading(true);
        this.service.get().pipe(finalize(() => this.configService.setLoading(false))).subscribe({
            next: (data) => this.delegations.set(data),
            error: () => this.showError('No se pudieron cargar las suplencias'),
        });
    }

    public submit(): void {
        this.form.markAllAsTouched();
        if (this.form.invalid) {
            return;
        }

        const value = this.form.value;
        if (value.userId === value.delegateUserId) {
            this.showError('El titular y el suplente no pueden ser el mismo usuario');
            return;
        }

        this.configService.setLoading(true);
        this.service.store({
            userId: value.userId!,
            delegateUserId: value.delegateUserId!,
            fromDate: dayjs(value.fromDate).format('YYYY-MM-DD'),
            toDate: value.toDate ? dayjs(value.toDate).format('YYYY-MM-DD') : null,
        }).pipe(finalize(() => this.configService.setLoading(false))).subscribe({
            next: () => {
                this.snackBar.open('Suplencia registrada', '✅', { horizontalPosition: 'center', verticalPosition: 'top', panelClass: 'alert-success', duration: 3000 });
                this.form.reset();
                this.load();
            },
            error: (err) => this.showError(err?.error?.message || 'No se pudo registrar la suplencia'),
        });
    }

    public remove(item: IApproverDelegation): void {
        this.configService.setLoading(true);
        this.service.delete(item.id).pipe(finalize(() => this.configService.setLoading(false))).subscribe({
            next: () => {
                this.snackBar.open('Suplencia eliminada', '✅', { horizontalPosition: 'center', verticalPosition: 'top', panelClass: 'alert-success', duration: 3000 });
                this.load();
            },
            error: (err) => this.showError(err?.error?.message || 'No se pudo eliminar la suplencia'),
        });
    }

    private showError(message: string): void {
        this.snackBar.open(message, '❌', { horizontalPosition: 'center', verticalPosition: 'top', panelClass: 'alert-error', duration: 3000 });
    }
}
