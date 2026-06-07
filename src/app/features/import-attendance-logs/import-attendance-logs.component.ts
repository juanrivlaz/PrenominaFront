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

    // Genera y descarga una plantilla CSV de ejemplo con el formato esperado por la
    // importación: Código de empleado, Hora de checada (HH:mm:ss) y Fecha (YYYY-MM-DD).
    // El backend omite la primera fila (encabezado) y lee las columnas en ese orden.
    public downloadTemplate(): void {
      const rows: Array<Array<string>> = [
        ['Codigo de empleado', 'Hora de checada (HH:mm:ss)', 'Fecha (AAAA-MM-DD)'],
        ['4018', '06:00:00', '2026-03-26'],
        ['4018', '22:54:00', '2026-03-26'],
        ['4018', '05:58:00', '2026-03-27'],
        ['4018', '23:01:00', '2026-03-27'],
      ];

      const csv = rows.map((row) => row.join(',')).join('\r\n');
      // BOM para que Excel respete los acentos del encabezado.
      const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'plantilla-carga-checadas.csv';
      link.click();
      window.URL.revokeObjectURL(url);
    }

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