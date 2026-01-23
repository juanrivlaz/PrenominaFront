import { IIncidentCode } from "@core/models/incident-code.interface";
import { EmployeeAdjustmentsService } from "../employee-adjustments.service";
import { TypeApplyIgnoreIncident } from "@core/models/enum/type-apply-ignore-incident";

export interface ISettingIncident {
    incidentCodes: Array<IIncidentCode>;
    id: number | string;
    name: string;
    type: TypeApplyIgnoreIncident;
    service: EmployeeAdjustmentsService;
}