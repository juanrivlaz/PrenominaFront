import { CommonModule } from "@angular/common";
import { Component, inject, model, OnInit, ViewEncapsulation } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { DialogModule } from "@shared/modules/material/dialog.module";
import { MaterialModule } from "@shared/modules/material/material.module";
import { MatListModule } from "@angular/material/list";
import { MatIconModule } from "@angular/material/icon";
import { ISettingIncident } from "./setting-incident.interface";
import { IIncidentCode } from "@core/models/incident-code.interface";
import { FormsModule } from "@angular/forms";
import { finalize, Observable } from "rxjs";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { TypeApplyIgnoreIncident } from "@core/models/enum/type-apply-ignore-incident";
import { IIgnoreIncidentToActivity } from "@core/models/ignore-incident-to-activity.interface";
import { IIgnoreIncidentToTenant } from "@core/models/ignore-incident-to-tenant.interface";
import { IIgnoreIncidentToEmployee } from "@core/models/ignore-incident-to-employee.interface";

@Component({
    selector: 'app-setting-incident',
    imports: [
        CommonModule,
        MaterialModule,
        DialogModule,
        MatListModule,
        MatIconModule,
        FormsModule,
        MatProgressSpinnerModule
    ],
    templateUrl: './setting-incident.component.html',
    styleUrl: './setting-incident.component.scss',
    encapsulation: ViewEncapsulation.None
})
export class SettingIncidentComponent implements OnInit {
    private readonly dialogRef = inject(MatDialogRef<SettingIncidentComponent>);
    public readonly data = inject<ISettingIncident>(MAT_DIALOG_DATA);
    public incidents = model<Array<IIncidentCode & { ignore: boolean }>>([]);
    public loading = model<boolean>(false);

    constructor() {}

    ngOnInit(): void {
        this.loading.set(true);
        let event: Observable<Array<IIgnoreIncidentToEmployee | IIgnoreIncidentToTenant | IIgnoreIncidentToActivity>> = this.data.service.getIgnoreIncidentTenant(this.data.id as string);

        if (this.data.type === TypeApplyIgnoreIncident.Employee) {
            event = this.data.service.getIgnoreIncidentEmployee(this.data.id as number);
        } else if (this.data.type === TypeApplyIgnoreIncident.Activity) {
            event = this.data.service.getIgnoreIncidentActivity(this.data.id as number);
        }

        event.pipe(finalize(() => {
            this.loading.set(false);
        })).subscribe({
            next: (response) => {
                this.incidents.set(this.data.incidentCodes.map((item) => ({
                    ...item,
                    ignore: response.some((incident) => incident.incidentCode === item.code && incident.ignore),
                })));
            },
            error: (err) => {
                console.error({
                    err
                });
            }
        });
    }

    public onCancel(): void {
        this.dialogRef.close();
    }

    public onSave(): void {
        this.dialogRef.close(this.incidents());
    }
}