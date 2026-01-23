import { Injectable } from "@angular/core";
import { IDateList } from "@core/models/date-list.interface";
import dayjs from "dayjs";

@Injectable({
    providedIn: 'root'
})
export class DatesService {
    public generateFechas(startDate: string | Date, endDate: string | Date): Array<IDateList> {
        let dates = [];
        let start = dayjs(startDate);
        let end = dayjs(endDate);
    
        while (start.isBefore(end) || start.isSame(end)) {
            dates.push({
                day: start.format("ddd").toUpperCase(),
                date: start.format("YYYY-MM-DD"),
                label: start.format("DD/MM/YY"),
                key: dates.length
            });
            start = start.add(1, "day");
        }
    
        return dates;
    }
}