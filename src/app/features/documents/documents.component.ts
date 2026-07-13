import { CommonModule } from "@angular/common";
import { Component, inject, OnInit, signal, ViewEncapsulation, WritableSignal } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { MatTableDataSource, MatTableModule } from "@angular/material/table";
import { MaterialModule } from "@shared/modules/material/material.module";
import { DocumentsService } from "./documents.service";
import { Document, DocumentModule } from "@core/models/document";
import { AppConfigService } from "@core/services/app-config/app-config.service";
import { finalize } from "rxjs";
import { MatSnackBar } from "@angular/material/snack-bar";
import { DocumentFormComponent, IDocumentFormData } from "./document-form/document-form.component";
import { DialogConfirmComponent } from "@shared/components/dialog-confirm/dialog-confirm.component";
import { IDialogConfirm } from "@shared/components/dialog-confirm/dialog-confirm.interface";

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
    private readonly dialog = inject(MatDialog);
    public documents: MatTableDataSource<Document> = new MatTableDataSource<Document>([]);
    public columns: Array<string> = [
        'name',
        'module',
        'signers',
        'actions'
    ];
    public loading: WritableSignal<boolean> = signal(false);

    private readonly moduleLabels: Record<number, string> = {
        [DocumentModule.Generic]: 'Genérico',
        [DocumentModule.Contracts]: 'Contratos',
        [DocumentModule.Permits]: 'Permisos',
        [DocumentModule.Notifications]: 'Notificaciones',
        [DocumentModule.OvertimePayment]: 'Pago de horas extras',
    };

    constructor(
        private readonly service: DocumentsService,
        private readonly configService: AppConfigService
    ) {}

    ngOnInit(): void {
        this.getInit();
    }

    public getModuleLabel(module?: number): string {
        if (module === undefined || module === null) return '—';
        return this.moduleLabels[module] || '—';
    }

    public openCreate(): void {
        const dialogRef = this.dialog.open<DocumentFormComponent, IDocumentFormData, Document | boolean>(
            DocumentFormComponent,
            { data: { mode: 'create' }, maxHeight: '95vh', maxWidth: '95vw', panelClass: 'document-form-dialog' }
        );

        dialogRef.afterClosed().subscribe((result) => {
            if (result) this.getInit();
        });
    }

    public openEdit(doc: Document): void {
        if (!doc.id) return;
        this.service.getById(doc.id).subscribe({
            next: (full) => {
                const dialogRef = this.dialog.open<DocumentFormComponent, IDocumentFormData, Document | boolean>(
                    DocumentFormComponent,
                    { data: { mode: 'edit', document: full }, maxHeight: '95vh', maxWidth: '95vw', panelClass: 'document-form-dialog' }
                );

                dialogRef.afterClosed().subscribe((result) => {
                    if (result) this.getInit();
                });
            },
            error: (err) => this.showError(err.error?.message || 'Error al cargar el documento')
        });
    }

    public confirmDelete(doc: Document): void {
        if (!doc.id) return;
        const dialogRef = this.dialog.open<DialogConfirmComponent, IDialogConfirm, boolean>(DialogConfirmComponent, {
            data: {
                title: 'Eliminar documento',
                message: `¿Eliminar la plantilla "${doc.name}"? Esta acción no se puede deshacer.`,
                confirmText: 'Eliminar',
                cancelText: 'Cancelar',
            }
        });

        dialogRef.afterClosed().subscribe((confirmed) => {
            if (!confirmed || !doc.id) return;
            this.service.delete(doc.id).subscribe({
                next: () => {
                    this.showSuccess('Documento eliminado');
                    this.getInit();
                },
                error: (err) => this.showError(err.error?.message || 'Error al eliminar el documento')
            });
        });
    }

    private getInit(): void {
        this.configService.setLoading(true);
        this.service.get().pipe(finalize(() => {
            this.configService.setLoading(false);
        })).subscribe({
            next: (response) => {
                this.documents.data = response;
            },
            error: (err) => this.showError(err.error?.message || 'Ocurrió un error, por favor intentalo más tarde')
        });
    }

    private showError(message: string): void {
        this._snackBar.open(message, '❌', {
            horizontalPosition: 'center',
            verticalPosition: 'top',
            panelClass: 'alert-error',
            duration: 3000
        });
    }

    private showSuccess(message: string): void {
        this._snackBar.open(message, '✅', {
            horizontalPosition: 'center',
            verticalPosition: 'top',
            panelClass: 'alert-success',
            duration: 2000
        });
    }
}
