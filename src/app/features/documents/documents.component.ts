import { CommonModule } from "@angular/common";
import { Component, inject, OnInit, ViewEncapsulation } from "@angular/core";
import { MatTableDataSource, MatTableModule } from "@angular/material/table";
import { MaterialModule } from "@shared/modules/material/material.module";
import { DocumentsService } from "./documents.service";
import { Document } from "@core/models/document";
import { AppConfigService } from "@core/services/app-config/app-config.service";
import { finalize } from "rxjs";
import { MatSnackBar } from "@angular/material/snack-bar";

@Component({
    selector: 'app-documents',
    imports: [
        CommonModule,
        MaterialModule,
        MatTableModule
    ],
    providers: [DocumentsService],
    templateUrl: './documents.component.html',
    styleUrl: './documents.component.scss',
    encapsulation: ViewEncapsulation.None,
})
export class DocumentsComponent implements OnInit {
    private readonly _snackBar = inject(MatSnackBar);
    public documents: MatTableDataSource<Document> = new MatTableDataSource<Document>([]);
    public columns: Array<string> = [
        'name',
        'modules',
        'params'
    ];

    constructor(
        private readonly service: DocumentsService,
        private readonly configService: AppConfigService
    ) {}

    ngOnInit(): void {
        this.getInit();
    }

    private getInit(): void {
        this.configService.setLoading(true);
        this.service.get().pipe(finalize(() => {
            this.configService.setLoading(false);
        })).subscribe({
            next: (response) => {
                console.log(response);
            },
            error: (err) => {
                const message = err.error?.message || 'Ocurrió un error, por favor intentalo más tarde';

                this._snackBar.open(message, undefined, {
                    horizontalPosition: 'center',
                    verticalPosition: 'top',
                    panelClass: 'alert-error',
                    duration: 3000
                });
            }
        })
    }
}