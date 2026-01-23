import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { FileAttendanceImport } from "@core/models/file-attendance-import";
import { Observable } from "rxjs";

@Injectable()
export class ImportAttendaceLogsService {
    constructor(private readonly httpService: HttpClient) {}

    public uploadCheckin(file: File): Observable<Pick<FileAttendanceImport, 'totalErrors' | 'totalImported'>> {
        const formData = new FormData();
        formData.append('File', file);

        return this.httpService.post<Pick<FileAttendanceImport, 'totalErrors' | 'totalImported'>>('/Clocks/import-checkins-from-file', formData);
    }
}