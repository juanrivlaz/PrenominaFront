import { IAssistanceIncident } from "@core/models/assistance-incident.interface";
import { AttendaceService } from "../attendace.service";

export interface IDetailsDay {
    assistanceIncidents?: Array<IAssistanceIncident>;
    name: string;
    activity: string;
    codigo: number;
    date: string;
    service: AttendaceService,
    checkEntry?: string | null;
    checkOut?: string | null;
    closedPeriod: boolean;
}