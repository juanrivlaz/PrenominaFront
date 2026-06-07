export interface IPendingIncidenceApproval {
    id: string;
    requestGroupId?: string | null;
    employeeCode: number;
    employeeName: string;
    incidentCode: string;
    incidentDescription: string;
    date: Date;
    notes?: string;
    createdAt: Date;
    totalApprovers: number;
    approvedCount: number;
    alreadyApprovedByMe: boolean;
    approved: boolean;
    rejected: boolean;
}

/**
 * Row of the "Incidences to approve" table. Groups incidences registered together
 * from the permits menu (same requestGroupId) to approve/reject them as a group.
 */
export interface IPendingIncidenceRow {
    /** requestGroupId of the group or id of the individual incidence. */
    key: string;
    /** True when it represents a multi-day group. */
    isGroup: boolean;
    requestGroupId?: string | null;
    employeeCode: number;
    employeeName: string;
    incidentCode: string;
    incidentDescription: string;
    notes?: string;
    createdAt: Date;
    startDate: Date;
    endDate: Date;
    daysCount: number;
    totalApprovers: number;
    approvedCount: number;
    alreadyApprovedByMe: boolean;
    approved: boolean;
    rejected: boolean;
    /** Individual incidences that make up the row (1 when not a group). */
    items: Array<IPendingIncidenceApproval>;
    expanded: boolean;
}
