import { CommonModule } from "@angular/common";
import { Component, inject, model, ViewEncapsulation } from "@angular/core";
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogRef, MatDialogTitle } from "@angular/material/dialog";
import { MatSelectModule } from "@angular/material/select";
import { MaterialModule } from "@shared/modules/material/material.module";
import { ClocksService } from "../clocks.service";
import { IClock } from "@core/models/clock.interface";
import { finalize } from "rxjs";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";

@Component({
    selector: 'app-create-clock',
    imports: [
        CommonModule,
        MaterialModule,
        ReactiveFormsModule,
        MatDialogContent,
        MatDialogActions,
        MatDialogClose,
        MatDialogTitle,
        MatSelectModule,
        MatProgressSpinnerModule
    ],
    providers: [
        ClocksService
    ],
    templateUrl: './create-clock.component.html',
    styleUrl: './create-clock.component.scss',
    encapsulation: ViewEncapsulation.None
})
export class CreateClockComponent {
    private readonly dialogRef = inject(MatDialogRef<CreateClockComponent>);
    public readonly data = inject<IClock | null>(MAT_DIALOG_DATA);
    public readonly isEdit: boolean = !!this.data;
    public createForm: FormGroup;
    public loading = model<boolean>(false);

    constructor(private readonly service: ClocksService) {
        this.createForm = new FormGroup({
            label: new FormControl(this.data?.label ?? '', {
                validators: [Validators.required]
            }),
            ip: new FormControl(this.data?.ip ?? '', {
                validators: [Validators.required]
            }),
            port: new FormControl(this.data?.port ?? null, {
                validators: [Validators.pattern(/^\d*$/)]
            })
        });

        this.dialogRef.disableClose = true;
    }

    public getFieldControl(key: string): AbstractControl | null {
        return this.createForm.get(key);
    }

    public submit(): void {
        this.loading.set(true);

        const request$ = this.isEdit
            ? this.service.update(this.data!.id, this.createForm.value)
            : this.service.create(this.createForm.value);

        request$.pipe(finalize(() => {
            this.loading.set(false);
        })).subscribe({
            next: (response) => {
                this.dialogRef.close(response);
            },
            error: (err) => {
                console.log({
                    err
                });
            }
        });
    }
}