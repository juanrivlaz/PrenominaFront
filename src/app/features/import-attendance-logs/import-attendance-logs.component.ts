import { CommonModule } from "@angular/common";
import { Component, inject, ViewEncapsulation } from "@angular/core";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { FileAttendanceImport } from "@core/models/file-attendance-import";
import { MaterialModule } from "@shared/modules/material/material.module";
import { v4 as uuid } from 'uuid';
import { ImportAttendaceLogsService } from "./import-attendance-logs.service";
import { MatSnackBar } from "@angular/material/snack-bar";

@Component({
    selector: 'app-import-attendance-logs',
    imports: [CommonModule, MaterialModule, MatProgressSpinnerModule],
    providers: [
      ImportAttendaceLogsService,
    ],
    templateUrl: './import-attendance-logs.component.html',
    styleUrl: './import-attendance-logs.component.scss',
    encapsulation: ViewEncapsulation.None
})
export class ImportAttendaceLogComponent {
    private readonly _snackBar = inject(MatSnackBar);
    public files: Array<FileAttendanceImport> = [];

    constructor(
      private readonly service: ImportAttendaceLogsService
    ) {}

    public onFileSelected(event: Event): void {
      const input = event.target as HTMLInputElement;
      if (input.files && input.files.length > 0) {
        const file = input.files[0];
        
        if (file) {
          var item = {
            id: uuid(),
            complete: false,
            file,
            errorsUrl: '',
            loading: true,
            totalImported: 0,
            totalErrors: 0
          };

          this.files.push(item);
          this.processFile(item);
        }
      }
    }

    private processFile(file: FileAttendanceImport): void {
      this.service.uploadCheckin(file.file).subscribe({
        next: (response) => {
          this.files = this.files.map((item) => {
            if (item.id === file.id) {
              return {
                ...item,
                loading: false,
                totalErrors: response.totalErrors,
                totalImported: response.totalImported,
              };
            }
            return item;
          });
        },
        error: (err) => {
          const message = err.error?.message || 'Ocurrió un error, por favor intentalo más tarde';

          this._snackBar.open(message, undefined, {
            horizontalPosition: 'center',
            verticalPosition: 'top',
            panelClass: 'alert-error',
            duration: 3000
          });

          this.files = this.files.map((item) => {
            if (item.id === file.id) {
              return {
                ...item,
                loading: false
              };
            }
            return item;
          });
        }
      });
    }
}