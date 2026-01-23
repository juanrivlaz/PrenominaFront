export interface IIgnoreIncidentToTenant {
    id: string;
    incidentCode: string;
    departmentCode: string;
    supervisorId: number;
    ignore: boolean;
}