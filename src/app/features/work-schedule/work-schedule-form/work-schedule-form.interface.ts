import { IWorkSchedule } from "@core/models/work-schedule.interface";

export interface IWorkScheduleFormData {
    mode: 'create' | 'edit';
    schedule?: IWorkSchedule;
}
