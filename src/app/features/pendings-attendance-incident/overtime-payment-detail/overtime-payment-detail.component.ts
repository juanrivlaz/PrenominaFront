import { CommonModule } from "@angular/common";
import { Component, computed, inject, ViewEncapsulation } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogRef, MatDialogTitle } from "@angular/material/dialog";
import { MaterialModule } from "@shared/modules/material/material.module";
import { AvatarComponent } from "@shared/components/avatar/avatar.component";
import { AbsenceRequestStatus } from "@core/models/enum/absence-request-status";
import { IAbsenceRequestApprovalStep } from "@core/models/pendings-attendance-incident/employee-absence-request-detail.interface";
import { IOvertimePaymentRequestDetail } from "@core/models/pendings-attendance-incident/overtime-payment-request.interface";

@Component({
    selector: 'app-overtime-payment-detail',
    imports: [
        CommonModule,
        MaterialModule,
        AvatarComponent,
        MatDialogContent,
        MatDialogActions,
        MatDialogClose,
        MatDialogTitle,
    ],
    templateUrl: './overtime-payment-detail.component.html',
    styleUrl: './overtime-payment-detail.component.scss',
    encapsulation: ViewEncapsulation.None,
})
export class OvertimePaymentDetailComponent {
    public readonly data = inject<IOvertimePaymentRequestDetail>(MAT_DIALOG_DATA);
    private readonly dialogRef = inject(MatDialogRef<OvertimePaymentDetailComponent>);

    public readonly statusApproved = AbsenceRequestStatus.Approved;
    public readonly statusRejected = AbsenceRequestStatus.Rejected;

    public readonly hasBlocked = (this.data.approvalChain ?? []).some(s => s.status === 'Blocked');

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

    public stepClass(step: IAbsenceRequestApprovalStep): string {
        switch (step.status) {
            case 'Approved': return 'is-approved';
            case 'Rejected': return 'is-rejected';
            case 'Skipped': return 'is-skipped';
            case 'Blocked': return 'is-blocked';
            default: return step.isCurrent ? 'is-current' : 'is-pending';
        }
    }

    public requestReResolve(): void {
        this.dialogRef.close('reresolve');
    }
}
