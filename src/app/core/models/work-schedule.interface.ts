export interface IWorkSchedule {
    id: string;
    label: string;
    startTime: string;
    endTime: string;
    breakStart?: string | null;
    breakEnd?: string | null;
    workHours: number;
    isNightShift: boolean;
}

export interface IWorkScheduleInput {
    label: string;
    startTime: string;
    endTime: string;
    breakStart?: string | null;
    breakEnd?: string | null;
    workHours: number;
    isNightShift: boolean;
}

export interface IEmployeeScheduleAssignment {
    id: string;
    employeeCode: number;
    workScheduleId: string;
    scheduleLabel: string;
    startTime: string;
    endTime: string;
    isNightShift: boolean;
    effectiveFrom: string;
    effectiveTo?: string | null;
}

export interface IActivityScheduleConfig {
    activityId: number;
    workScheduleId: string;
    scheduleLabel: string;
    isNightShift: boolean;
}
