import { CommonModule } from "@angular/common";
import { Component, computed, inject, ViewEncapsulation } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogTitle } from "@angular/material/dialog";
import { MaterialModule } from "@shared/modules/material/material.module";
import { AvatarComponent } from "@shared/components/avatar/avatar.component";
import { AbsenceRequestStatus } from "@core/models/enum/absence-request-status";
import { IEmployeeAbsenceRequestDetail } from "@core/models/pendings-attendance-incident/employee-absence-request-detail.interface";

@Component({
    selector: 'app-absence-request-detail',
    imports: [
        CommonModule,
        MaterialModule,
        AvatarComponent,
        MatDialogContent,
        MatDialogActions,
        MatDialogClose,
        MatDialogTitle,
    ],
    templateUrl: './absence-request-detail.component.html',
    styleUrl: './absence-request-detail.component.scss',
    encapsulation: ViewEncapsulation.None,
})
export class AbsenceRequestDetailComponent {
    public readonly data = inject<IEmployeeAbsenceRequestDetail>(MAT_DIALOG_DATA);

    public readonly statusPending = AbsenceRequestStatus.Pending;
    public readonly statusApproved = AbsenceRequestStatus.Approved;
    public readonly statusRejected = AbsenceRequestStatus.Rejected;

    public readonly statusLabel = computed(() => {
        switch (this.data.status) {
            case AbsenceRequestStatus.Approved: return 'Aprobada';
            case AbsenceRequestStatus.Rejected: return 'Rechazada';
            default: return 'Pendiente';
        }
    });

    public readonly statusClass = computed(() => {
        switch (this.data.status) {
            case AbsenceRequestStatus.Approved: return 'approved';
            case AbsenceRequestStatus.Rejected: return 'rejected';
            default: return 'pending';
        }
    });
}
