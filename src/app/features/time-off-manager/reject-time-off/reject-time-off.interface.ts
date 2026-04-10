export interface IRejectTimeOff {
    employeeCode: number;
    employeeName: string;
    date: string;
    incidentCode: string;
    groupDates: Array<string>;
}

export interface IRejectTimeOffOutput {
    comment: string;
}
