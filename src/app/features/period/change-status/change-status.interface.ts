import { IPrenominaPeriod } from "@core/models/prenomina-period.interface";
import { PeriodService } from "../period.service";

export interface IChangeStatus extends IPrenominaPeriod {
  service: PeriodService;
}