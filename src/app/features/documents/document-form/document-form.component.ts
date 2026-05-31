import { CommonModule } from "@angular/common";
import { Component, inject, signal, ViewEncapsulation } from "@angular/core";
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogRef, MatDialogTitle } from "@angular/material/dialog";
import { MatSelectModule } from "@angular/material/select";
import { MaterialModule } from "@shared/modules/material/material.module";
import { EditorModule } from "@tinymce/tinymce-angular";
import { Document, DocumentModule, IDocumentInput } from "@core/models/document";
import { DocumentsService } from "../documents.service";
import { finalize, Observable } from "rxjs";
import { environment } from "../../../../environments/environment";

export interface IDocumentFormData {
    mode: 'create' | 'edit';
    document?: Document;
}

@Component({
    selector: 'app-document-form',
    imports: [
        CommonModule,
        MaterialModule,
        ReactiveFormsModule,
        MatSelectModule,
        EditorModule,
        MatDialogContent,
        MatDialogActions,
        MatDialogClose,
        MatDialogTitle,
    ],
    templateUrl: './document-form.component.html',
    styleUrl: './document-form.component.scss',
    providers: [DocumentsService],
    encapsulation: ViewEncapsulation.None,
})
export class DocumentFormComponent {
    public readonly data = inject<IDocumentFormData>(MAT_DIALOG_DATA);
    private readonly dialogRef = inject(MatDialogRef<DocumentFormComponent>);
    private readonly service = inject(DocumentsService);

    public readonly loading = signal(false);
    public readonly errorMessage = signal<string | null>(null);
    public readonly form: FormGroup;

    public readonly moduleOptions: Array<{ id: DocumentModule, label: string }> = [
        { id: DocumentModule.Generic, label: 'Genérico' },
        { id: DocumentModule.Contracts, label: 'Contratos' },
        { id: DocumentModule.Permits, label: 'Permisos' },
        { id: DocumentModule.Notifications, label: 'Notificaciones' },
    ];

    // Lista sugerida de placeholders disponibles. El usuario puede insertar cualquiera.
    public readonly availablePlaceholders: Array<string> = [
        'employeeName', 'employeeCode', 'employeeActivity', 'departmentName',
        'companyName', 'today', 'startDate', 'endDate', 'totalDays'
    ];

    public readonly tinymceApiKey = environment.tinymceApiKey;
    public readonly editorConfig = {
        height: '100%',
        min_height: 240,
        menubar: 'file edit view insert format tools table',
        plugins: 'advlist autolink lists link image charmap preview anchor searchreplace visualblocks code fullscreen insertdatetime media table wordcount help',
        toolbar: 'undo redo | blocks | bold italic underline | bullist numlist | link table | alignleft aligncenter alignright | removeformat | code',
        branding: false,
        statusbar: true,
        content_style: 'body { font-family: Inter, system-ui, sans-serif; font-size: 13px; }',
    };

    constructor() {
        this.dialogRef.disableClose = true;
        const doc = this.data.document;
        this.form = new FormGroup({
            name: new FormControl(doc?.name ?? '', [Validators.required]),
            module: new FormControl<DocumentModule>(doc?.module ?? DocumentModule.Generic),
            content: new FormControl(doc?.content ?? ''),
            keyParams: new FormControl<string>((doc?.keyParams ?? []).join(', ')),
        });
    }

    public insertPlaceholder(name: string): void {
        const ctrl = this.form.get('content');
        if (!ctrl) return;
        ctrl.setValue((ctrl.value || '') + ` {{${name}}} `);
    }

    public submit(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }
        const value = this.form.value;
        const payload: IDocumentInput = {
            name: value.name,
            module: value.module,
            content: value.content,
            path: null,
            keyParams: (value.keyParams || '').split(',').map((p: string) => p.trim()).filter((p: string) => p.length > 0),
        };

        this.loading.set(true);
        this.errorMessage.set(null);
        const obs$: Observable<Document | boolean> = this.data.mode === 'edit' && this.data.document?.id
            ? this.service.update(this.data.document.id, payload)
            : this.service.create(payload);

        obs$.pipe(finalize(() => this.loading.set(false))).subscribe({
            next: (result: Document | boolean) => this.dialogRef.close(result ?? true),
            error: (err: { error?: { message?: string } }) => this.errorMessage.set(err.error?.message || 'Error al guardar el documento'),
        });
    }
}
