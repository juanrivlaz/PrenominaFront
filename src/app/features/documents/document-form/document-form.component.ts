import { CommonModule } from "@angular/common";
import { Component, inject, signal, ViewEncapsulation } from "@angular/core";
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogRef, MatDialogTitle } from "@angular/material/dialog";
import { MatSelectModule } from "@angular/material/select";
import { MatTabsModule } from "@angular/material/tabs";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MaterialModule } from "@shared/modules/material/material.module";
import { EditorModule } from "@tinymce/tinymce-angular";
import { Document, DocumentModule, IDocumentInput } from "@core/models/document";
import { Role } from "@core/models/role";
import { DocumentsService } from "../documents.service";
import { finalize, Observable } from "rxjs";

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
        MatTabsModule,
        MatTooltipModule,
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
    public readonly roles = signal<Array<Role>>([]);

    public readonly scopeOptions = [
        { value: 1, label: 'Jefe del departamento del empleado' },
        { value: 2, label: 'A nivel empresa (RH, Contralor, Dirección)' },
    ];
    public readonly modeOptions = [
        { value: 1, label: 'Basta que firme uno' },
        { value: 2, label: 'Deben firmar todos' },
    ];

    public readonly moduleOptions: Array<{ id: DocumentModule, label: string }> = [
        { id: DocumentModule.Generic, label: 'Genérico' },
        { id: DocumentModule.Contracts, label: 'Contratos' },
        { id: DocumentModule.Permits, label: 'Permisos' },
        { id: DocumentModule.Notifications, label: 'Notificaciones' },
        { id: DocumentModule.OvertimePayment, label: 'Pago de horas extras' },
    ];

    // Lista sugerida de placeholders disponibles. El usuario puede insertar cualquiera.
    // La descripción se muestra como tooltip en cada chip para indicar qué representa.
    public readonly availablePlaceholders: Array<{ key: string; description: string }> = [
        { key: 'logo', description: 'Logotipo de la empresa' },
        { key: 'employeeName', description: 'Nombre completo del empleado' },
        { key: 'employeeCode', description: 'Código/número del empleado' },
        { key: 'employeeActivity', description: 'Actividad o puesto del empleado' },
        { key: 'departmentName', description: 'Departamento del empleado' },
        { key: 'companyName', description: 'Nombre de la empresa' },
        { key: 'today', description: 'Fecha de emisión del documento' },
        { key: 'startDate', description: 'Fecha de inicio del permiso' },
        { key: 'endDate', description: 'Fecha de fin del permiso' },
        { key: 'returnDate', description: 'Fecha de regreso del permiso' },
        { key: 'totalDays', description: 'Total de días del permiso' },
        { key: 'permissionLabel', description: 'Tipo/etiqueta del permiso' },
        { key: 'totalOvertime', description: 'Total de horas extras a pagar' },
        { key: 'overtimeDates', description: 'Fechas de donde se tomaron las horas extras (separadas por coma)' },
        { key: 'notes', description: 'Notas o comentarios' },
        { key: 'signatures', description: 'Bloque de firmas de la cadena de aprobación' },
    ];

    public readonly editorConfig = {
        // TinyMCE auto-alojado (gratuito, sin API key). Los assets se copian a /tinymce/.
        base_url: '/tinymce',
        suffix: '.min',
        license_key: 'gpl',
        height: 600,
        min_height: 600,
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
            approvalSteps: new FormArray(
                (doc?.approvalSteps ?? [])
                    .slice()
                    .sort((a, b) => a.stepOrder - b.stepOrder)
                    .map(step => this.buildStepGroup(step.roleId, step.scope, step.mode, step.isOptional))
            ),
        });

        this.service.getRoles().subscribe({
            next: (data) => this.roles.set(data),
            error: () => { /* silencioso: la cadena es opcional */ },
        });
    }

    // ===== Cadena de firmas =====
    public get approvalSteps(): FormArray {
        return this.form.get('approvalSteps') as FormArray;
    }

    private buildStepGroup(roleId = '', scope = 2, mode = 1, isOptional = false): FormGroup {
        return new FormGroup({
            roleId: new FormControl(roleId, { validators: [Validators.required] }),
            scope: new FormControl(scope, { validators: [Validators.required] }),
            mode: new FormControl(mode, { validators: [Validators.required] }),
            isOptional: new FormControl(isOptional),
        });
    }

    public addStep(): void {
        this.approvalSteps.push(this.buildStepGroup());
    }

    public removeStep(index: number): void {
        this.approvalSteps.removeAt(index);
    }

    public moveStep(index: number, direction: -1 | 1): void {
        const target = index + direction;
        if (target < 0 || target >= this.approvalSteps.length) {
            return;
        }
        const control = this.approvalSteps.at(index);
        this.approvalSteps.removeAt(index);
        this.approvalSteps.insert(target, control);
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
        const approvalSteps = (value.approvalSteps || [])
            .filter((step: { roleId?: string }) => !!step.roleId)
            .map((step: { roleId: string; scope: number; mode: number; isOptional: boolean }, index: number) => ({
                stepOrder: index + 1,
                roleId: step.roleId,
                scope: step.scope,
                mode: step.mode,
                isOptional: step.isOptional,
            }));

        const payload: IDocumentInput = {
            name: value.name,
            module: value.module,
            content: value.content,
            path: null,
            keyParams: (value.keyParams || '').split(',').map((p: string) => p.trim()).filter((p: string) => p.length > 0),
            approvalSteps,
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
