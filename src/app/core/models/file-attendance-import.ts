export interface FileAttendanceImport {
    id: string;
    file: File;
    complete: boolean;
    errorsUrl: string;
    loading: boolean;
    totalImported: number;
    totalErrors: number;
}