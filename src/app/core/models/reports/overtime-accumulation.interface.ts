export enum OvertimeMovementType {
    Accumulation = 1,
    UsedForRestDay = 2,
    DirectPayment = 3,
    ManualAdjustment = 4,
    Cancellation = 5,
    HourBank = 6,
    ExternalEntry = 7,
    UsedForTimeOff = 8
}

export enum OvertimeDayStatus {
    Pending = 0,
    Accumulated = 1,
    Paid = 2,
    Cancelled = 3,
    HourBank = 4
}

export interface IOvertimeAccumulation {
    employeeCode: number;
    fullName: string;
    department: string;
    jobPosition: string;
    availableMinutes: number;
    availableFormatted: string;
    totalAccumulatedMinutes: number;
    totalUsedMinutes: number;
    totalPaidMinutes: number;
    lastUpdated: string;
}

export interface IOvertimeMovementLog {
    id: number;
    employeeCode: number;
    employeeName: string;
    movementType: OvertimeMovementType;
    movementTypeLabel: string;
    minutes: number;
    minutesFormatted: string;
    balanceAfter: number;
    balanceAfterFormatted: string;
    sourceDate: string;
    appliedRestDate?: string;
    originalCheckIn?: string;
    originalCheckOut?: string;
    notes?: string;
    createdByUser: string;
    createdAt: string;
    isCancelled: boolean;
    cancellationMovementId?: number;
}

export interface IOvertimeMovementsPaged {
    items: IOvertimeMovementLog[];
    totalRecords: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

export interface IOvertimeDayDetail {
    date: string;
    checkIn: string;
    checkOut?: string;
    totalMinutesWorked: number;
    overtimeMinutes: number;
    overtimeFormatted: string;
    status: OvertimeDayStatus;
    statusLabel: string;
    movementId?: number;
}

export interface IOvertimeSummary {
    employeeCode: number;
    fullName: string;
    department: string;
    jobPosition: string;
    totalOvertimeMinutes: number;
    totalOvertimeFormatted: string;
    accumulatedMinutes: number;
    paidMinutes: number;
    paidMinutesFormatted: string;
    pendingMinutes: number;
    currentBalance: number;
    currentBalanceFormatted: string;
    dayDetails: IOvertimeDayDetail[];
}

export interface IOvertimeOperationResult {
    success: boolean;
    message: string;
    movementId?: number;
    newBalance: number;
    newBalanceFormatted: string;
}

// Input interfaces
export interface IAccumulateOvertimeInput {
    employeeCode: number;
    sourceDate: string;
    minutes: number;
    checkIn?: string;
    checkOut?: string;
    notes?: string;
}

export interface IPayOvertimeDirectInput {
    employeeCode: number;
    sourceDate: string;
    minutes: number;
    checkIn?: string;
    checkOut?: string;
    notes?: string;
}

export interface IUseOvertimeForRestDayInput {
    employeeCode: number;
    restDate: string;
    minutesToUse: number;
    sourceMovementIds?: number[];
    notes?: string;
}

export interface IProcessOvertimesBatchInput {
    typeNomina: number;
    numPeriod: number;
    accumulate: boolean;
    employeeCodes?: number[];
    notes?: string;
}

export interface ICancelOvertimeMovementInput {
    movementId: number;
    reason: string;
}

export interface ISendToHourBankInput {
    employeeCode: number;
    sourceDate: string;
    minutes: number;
    checkIn?: string;
    checkOut?: string;
    notes?: string;
}

export interface IManualOvertimeEntryInput {
    employeeCode: number;
    sourceDate: string;
    minutes: number;
    notes?: string;
    externalReference?: string;
}
