import { CommonModule } from "@angular/common";
import { Component, inject, model, OnInit, signal, ViewEncapsulation, WritableSignal } from "@angular/core";
import { MatChipsModule } from "@angular/material/chips";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatDividerModule } from "@angular/material/divider";
import { MatSelectModule } from "@angular/material/select";
import { MatSlideToggleModule } from "@angular/material/slide-toggle";
import { MatTooltipModule } from "@angular/material/tooltip";
import { FormArray, FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from "@angular/forms";
import { NgxColorsModule } from "ngx-colors";
import { MaterialModule } from "@shared/modules/material/material.module";
import { Section } from "./enums/section.enum";
import { appAnimations } from "@core/animations";
import { AppConfigService } from "@core/services/app-config/app-config.service";
import { TypeTenant } from "@core/models/enum/type-tenant";
import { TimeZone } from "@core/models/enum/time-zone";
import { AuthService } from "@core/services/auth/auth.service";
import { EditorModule } from "@tinymce/tinymce-angular";
import { SettingsService } from "./settings.service";
import { MatSnackBar } from "@angular/material/snack-bar";
import { TypeDayOffReport } from "@core/models/config-day-off-report.interface";
import { finalize } from "rxjs";
import { TypeAttendance } from "@core/models/reports/type-attendance.enum";
import { NameOrder } from "@core/models/reports/config-name-format.interface";

@Component({
    selector: 'app-settings',
    imports: [
        CommonModule,
        MaterialModule,
        MatChipsModule,
        MatDividerModule,
        MatTooltipModule,
        NgxColorsModule,
        FormsModule,
        MatSelectModule,
        EditorModule,
        ReactiveFormsModule,
        MatSlideToggleModule,
        MatDatepickerModule,
    ],
    providers: [
        SettingsService,
    ],
    templateUrl: './settings.component.html',
    styleUrl: './settings.component.scss',
    animations: appAnimations,
    encapsulation: ViewEncapsulation.None,
})
export class SettingsComponent implements OnInit {
    private readonly _snackBar = inject(MatSnackBar);
    public activeSection = model<Section>(Section.Application);
    public primaryColor = model<string>('N/A');
    public secondayColor = model<string>('N/A');
    public previewLogo = model<string>('assets/icons/zoom-app.svg');
    public typeTenant = model<number>(TypeTenant.Department);
    public timeZone = model<string>(TimeZone.Bahia_Banderas);
    public typeDayOffReport = model<number>(0);
    public typePrenominaPdfReport = model<number>(0);
    public clockInterval: FormControl;
    public year: FormControl;
    public loadingClockInterval = model<boolean>(false);
    public loadingTypeTenant = model<boolean>(false);
    public loadingTypeDayOffReport = model<boolean>(false);
    public loadingTypePrenominaPdfReport = model<boolean>(false);
    public loadingYear = model<boolean>(false);
    public typeTenantsOptions: Array<{ id: number, label: string }>;
    public timeZoneOptions: Array<{ id: string, label: string }>;
    public initConfigEditor = {
        // TinyMCE auto-alojado (gratuito, sin API key).
        base_url: '/tinymce',
        suffix: '.min',
        license_key: 'gpl',
        plugins: [
            // Core editing features
            'anchor', 'autolink', 'charmap', 'codesample', 'emoticons', 'image', 'link', 'lists', 'media', 'searchreplace', 'table', 'visualblocks', 'wordcount',
            // Your account includes a free trial of TinyMCE premium features
            // Try the most popular premium features until Jul 18, 2025:
            //'checklist', 
            //'mediaembed',
            //'casechange',
            //'formatpainter',
            //'pageembed',
            //'a11ychecker',
            //'tinymcespellchecker',
            //'permanentpen',
            //'powerpaste',
            //'advtable',
            //'advcode',
            //'editimage',
            //'advtemplate',
            //'mentions',
            //'tinycomments',
            //'tableofcontents',
            //'footnotes',
            //'mergetags',
            //'autocorrect',
            //'typography',
            //'inlinecss',
            //'markdown',
            //'importword',
            //'exportword',
            //'exportpdf'
        ],
        toolbar: 'undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | link image media table mergetags | addcomment showcomments | spellcheckdialog a11ycheck typography | align lineheight | checklist numlist bullist indent outdent | emoticons charmap | removeformat',
        tinycomments_mode: 'embedded',
        tinycomments_author: 'Author name',
        mergetags_list: [
            { value: 'First.Name', title: 'First Name' },
            { value: 'Email', title: 'Email' },
        ],
    };
    public contentDocument = "";
    public typeDayOffReportOptions = Array<{ id: number, label: string }>(
        { id: TypeDayOffReport.Default, label: 'Formato Anterior' },
        { id: TypeDayOffReport.New, label: 'Formato Nuevo' },
    );
    public typePrenominaPdfReportOptions = Array<{ id: number, label: string }>(
        { id: TypeAttendance.Standard, label: 'Formato Completo' },
        { id: TypeAttendance.Compact, label: 'Formato Compacto' },
    );
    public minToOvertimeReport: FormControl;
    public loadingMinToOvertimeReport = model<boolean>(false);

    // Firmas (hasta 4)
    public signaturesForm: FormGroup;
    public loadingSignatures = model<boolean>(false);

    // Formato de nombre
    public nameOrder = model<NameOrder>(NameOrder.FirstNameFirst);
    public loadingNameFormat = model<boolean>(false);
    public nameOrderOptions: Array<{ id: NameOrder, label: string, preview: string }> = [
        { id: NameOrder.FirstNameFirst, label: 'Nombre, Apellido Paterno, Apellido Materno', preview: 'Juan Carlos García López' },
        { id: NameOrder.LastNameFirst, label: 'Apellido Paterno, Apellido Materno, Nombre', preview: 'García López Juan Carlos' },
    ];

    // Compact PDF options (tamaño letra + inicial del día)
    public compactFontSize: FormControl;
    public showDayInitial = model<boolean>(true);
    public loadingCompactPdfOptions = model<boolean>(false);

    // BioTime Sync
    public bioTimeEnabled = new FormControl(false);
    public bioTimeSyncHour = new FormControl('20:00', [Validators.required]);
    public bioTimeEmail = new FormControl('', [Validators.required]);
    public bioTimePassword = new FormControl('');
    public bioTimeCompany = new FormControl('', [Validators.required]);
    public loadingBioTimeConfig: WritableSignal<boolean> = signal(false);
    public loadingBioTimeCreds: WritableSignal<boolean> = signal(false);
    public loadingBioTimeSync: WritableSignal<boolean> = signal(false);
    public bioTimeCredentialsConfigured: WritableSignal<boolean> = signal(false);
    public readonly bioTimeSyncRange = new FormGroup({
        start: new FormControl<Date | null>(null),
        end: new FormControl<Date | null>(null),
    });
    public readonly bioTimeMaxDate = new Date();

    public constructor(
        private appConfigService: AppConfigService,
        private authService: AuthService,
        private service: SettingsService,
        private fb: FormBuilder,
    ) {
        this.signaturesForm = this.fb.group({
            signatures: this.fb.array([])
        });
        this.compactFontSize = new FormControl(8, [Validators.required, Validators.min(6), Validators.max(20)]);
        const { primaryColor, secondColor, logo } = this.appConfigService.settings;
        this.primaryColor.set(primaryColor);
        this.secondayColor.set(secondColor);
        this.previewLogo.set(logo)

        this.primaryColor.subscribe((value) => {
            this.appConfigService.setPrimaryColor(value);
        });

        this.secondayColor.subscribe((value) => {
            this.appConfigService.setSecondColor(value);
        });

        this.typeTenantsOptions = Object.entries(TypeTenant).filter((item) => Number.isNaN(Number(item[0]))).map(([key, value]) => ({ id: value as number, label: key }));
        this.timeZoneOptions = Object.entries(TimeZone).filter((item) => Number.isNaN(Number(item[0]))).map(([key, value]) => ({ id: value, label: key.replace('_', ' ')}));
        this.typeTenant.set(this.authService.typeTenant.value);
        this.timeZone.set(this.authService.timeZone.value);

        this.timeZone.subscribe((value) => {
            this.authService.setTimeZone(value as TimeZone);
        });

        this.typeTenant.subscribe((value) => {
            this.authService.setTypeTenant(value);
        });

        this.clockInterval = new FormControl(10, [Validators.required, Validators.min(10)]);
        this.year = new FormControl<number>(this.authService.year.value, [Validators.required, Validators.min(2000)]);
        this.minToOvertimeReport = new FormControl(30, [Validators.required, Validators.min(1)]);

        this.year.valueChanges.subscribe((value) => {
            this.authService.setYear(value);
        });
    }

    ngOnInit(): void {
        this.init();
    }

    public init() {
        this.appConfigService.setLoading(true);
        this.service.getConfigReports().pipe(finalize(() => {
            this.appConfigService.setLoading(false);
        })).subscribe({
            next: (config) => {
                this.typeDayOffReport.set(config.configDayOffReport.typeDayOffReport);
                this.minToOvertimeReport.setValue(config.configOvertimeReport.mins);
                this.typePrenominaPdfReport.set(config.configAttendanceReport?.typeAttendanceReportPdf || 0);
                this.compactFontSize.setValue(config.configAttendanceReport?.compactFontSize ?? 8);
                this.showDayInitial.set(config.configAttendanceReport?.showDayInitial ?? true);
                this.nameOrder.set(config.configNameFormat?.order ?? NameOrder.FirstNameFirst);

                this.signaturesArray.clear();
                const list = (config.configSignatures?.signatures ?? []).slice(0, 4);
                if (list.length === 0) {
                    // Inicia con una sola firma vacía si no hay configuración previa.
                    this.signaturesArray.push(this.buildSignatureGroup());
                } else {
                    for (const item of list) {
                        this.signaturesArray.push(this.buildSignatureGroup(item.name, item.position));
                    }
                }
            },
            error: (err) => {
                const message = err.error?.message || 'Ocurrió un error, por favor intentalo más tarde';
                this.showMessage(message, true, 3000);
            }
        });

        this.loadBioTimeConfig();
    }

    private loadBioTimeConfig(): void {
        this.service.getBioTimeSyncConfig().subscribe({
            next: (config: any) => {
                this.bioTimeEnabled.setValue(config.enabled);
                this.bioTimeSyncHour.setValue(config.syncHour || '20:00');
            }
        });
        this.service.getBioTimeCredentialsStatus().subscribe({
            next: (status) => {
                this.bioTimeCredentialsConfigured.set(status.configured);
                if (status.configured) {
                    this.bioTimeEmail.setValue(status.email);
                    this.bioTimeCompany.setValue(status.company);
                }
            }
        });
    }

    public handleChangeLogo(event: Event): void {
        const element = event.target as HTMLInputElement;
        const file = element.files?.[0];

        if (file && ['image/png', 'image/jpeg', 'image/svg+xml'].includes(file.type)) {
            const reader = new FileReader();
            reader.onload = () => {
                this.previewLogo.set(reader.result as string);
                this.appConfigService.setLogo(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    }

    public handleChangeSection(section: keyof typeof Section): void {
        this.activeSection.set(Section[section]);
    }

    public sectionIsActive(section: keyof typeof Section): boolean {
        return this.activeSection() === Section[section];
    }

    public saveDoc(): void {
        console.log({
            con: this.contentDocument,
        });
    }

    public handleSaveClockInterval(): void {
        if (this.clockInterval.invalid) {
            return;
        }

        this.loadingClockInterval.set(true);
        this.service.updateClockInterval(this.clockInterval.value).pipe(finalize(() => {
            this.loadingClockInterval.set(false);
        })).subscribe({
            next: () => {
                this.showMessage('Los cambios fueron guardados', false, 1500);
            },
            error: (err) => {
                const message = err.error?.message || 'Ocurrió un error, por favor intentalo más tarde';
                this.showMessage(message, true, 3000);
            }
        });
    }

    public handleSaveYear(): void {
        if (this.year.invalid) {
            return;
        }
        this.loadingYear.set(true);
        this.service.updateYear(this.year.value).pipe(finalize(() => {
            this.loadingYear.set(false);
        })).subscribe({
            next: () => {
                this.showMessage('Los cambios fueron guardados', false, 1500);
            },
            error: (err) => {
                const message = err.error?.message || 'Ocurrió un error, por favor intentalo más tarde';
                this.showMessage(message, true, 3000);
            }
        });
    }

    public handleSaveMinToOvertimeReport(): void {
        if (this.minToOvertimeReport.invalid) {
            return;
        }
        this.loadingMinToOvertimeReport.set(true);
        this.service.updateMinToOvertimeReport(this.minToOvertimeReport.value).pipe(finalize(() => {
            this.loadingMinToOvertimeReport.set(false);
        })).subscribe({
            next: () => {
                this.showMessage('Los cambios fueron guardados', false, 1500);
            },
            error: (err) => {
                const message = err.error?.message || 'Ocurrió un error, por favor intentalo más tarde';
                this.showMessage(message, true, 3000);
            }
        });
    }

    public handleSaveTypeTenant(event: Event): void {
        event.stopPropagation();
        this.loadingTypeTenant.set(true);

        this.service.updateTypeTenantMode(this.typeTenant()).pipe(finalize(() => {
            this.loadingTypeTenant.set(false);
        })).subscribe({
            next: () => {
                this.showMessage('Los cambios fueron guardados', false, 1500);
            },
            error: (err) => {
                const message = err.error?.message || 'Ocurrió un error, por favor intentalo más tarde';
                this.showMessage(message, true, 3000);
            }
        });
    }

    public handleSaveTypeDayOffReport(event: Event): void {
        event.stopPropagation();
        this.loadingTypeDayOffReport.set(true);

        this.service.updateTypeDayOffReport(this.typeDayOffReport()).pipe(finalize(() => {
            this.loadingTypeDayOffReport.set(false);
        })).subscribe({
            next: () => {
                this.showMessage('Los cambios fueron guardados', false, 1500);
            },
            error: (err) => {
                const message = err.error?.message || 'Ocurrió un error, por favor intentalo más tarde';
                this.showMessage(message, true, 3000);
            }
        });
    }

    public get signaturesArray(): FormArray {
        return this.signaturesForm.get('signatures') as FormArray;
    }

    public readonly maxSignatures = 4;

    private buildSignatureGroup(name = '', position = '') {
        return this.fb.group({
            name: [name],
            position: [position],
        });
    }

    public addSignature(): void {
        if (this.signaturesArray.length >= this.maxSignatures) return;
        this.signaturesArray.push(this.buildSignatureGroup());
    }

    public removeSignature(index: number): void {
        if (this.signaturesArray.length === 1) {
            // Si es la última, sólo limpia los campos en lugar de eliminar.
            this.signaturesArray.at(0).reset({ name: '', position: '' });
            return;
        }
        this.signaturesArray.removeAt(index);
    }

    public handleSaveSignatures(): void {
        const raw = this.signaturesArray.value as Array<{ name: string, position: string }>;
        const cleaned = raw
            .map((s) => ({ name: (s.name || '').trim(), position: (s.position || '').trim() }))
            .filter((s) => s.name.length > 0 || s.position.length > 0);

        this.loadingSignatures.set(true);
        this.service.updateSignatures(cleaned).pipe(finalize(() => {
            this.loadingSignatures.set(false);
        })).subscribe({
            next: () => this.showMessage('Firmas guardadas', false, 1500),
            error: (err) => this.showMessage(err.error?.message || 'Error al guardar', true, 3000),
        });
    }

    public handleSaveNameFormat(): void {
        this.loadingNameFormat.set(true);
        this.service.updateNameFormat(this.nameOrder()).pipe(finalize(() => {
            this.loadingNameFormat.set(false);
        })).subscribe({
            next: () => this.showMessage('Formato de nombre guardado', false, 1500),
            error: (err) => this.showMessage(err.error?.message || 'Error al guardar', true, 3000),
        });
    }

    public handleSaveCompactPdfOptions(): void {
        if (this.compactFontSize.invalid) {
            return;
        }
        this.loadingCompactPdfOptions.set(true);
        this.service.updateCompactPdfOptions(this.compactFontSize.value, this.showDayInitial())
            .pipe(finalize(() => this.loadingCompactPdfOptions.set(false)))
            .subscribe({
                next: () => this.showMessage('Opciones del PDF compacto guardadas', false, 1500),
                error: (err) => this.showMessage(err.error?.message || 'Error al guardar', true, 3000),
            });
    }

    public handleSaveTypePrenominaPdfReport(event: Event): void {
        event.stopPropagation();
        this.loadingTypePrenominaPdfReport.set(true);

        this.service.updateTypePrenominaPdfReport(this.typePrenominaPdfReport()).pipe(finalize(() => {
            this.loadingTypePrenominaPdfReport.set(false);
        })).subscribe({
            next: () => {
                this.showMessage('Los cambios fueron guardados', false, 1500);
            },
            error: (err) => {
                const message = err.error?.message || 'Ocurrió un error, por favor intentalo más tarde';
                this.showMessage(message, true, 3000);
            }
        });
    }

    public handleSaveBioTimeConfig(): void {
        this.loadingBioTimeConfig.set(true);
        this.service.saveBioTimeSyncConfig({
            syncHour: this.bioTimeSyncHour.value || '20:00',
            enabled: this.bioTimeEnabled.value || false
        }).pipe(finalize(() => this.loadingBioTimeConfig.set(false)))
        .subscribe({
            next: () => this.showMessage('Configuración de sincronización guardada', false, 1500),
            error: (err) => this.showMessage(err.error?.message || 'Error al guardar', true, 3000)
        });
    }

    public getBioTimeApiUrl(): string {
        const company = this.bioTimeCompany.value || '';
        return company ? `https://${company}.biotime.mx` : '';
    }

    public handleSaveBioTimeCredentials(): void {
        if (this.bioTimeEmail.invalid || this.bioTimeCompany.invalid) {
            this.showMessage('Complete todos los campos requeridos', true, 3000);
            return;
        }

        this.loadingBioTimeCreds.set(true);
        this.service.saveBioTimeCredentials({
            email: this.bioTimeEmail.value || '',
            password: this.bioTimePassword.value || '',
            company: this.bioTimeCompany.value || ''
        }).pipe(finalize(() => this.loadingBioTimeCreds.set(false)))
        .subscribe({
            next: () => {
                this.bioTimeCredentialsConfigured.set(true);
                this.bioTimePassword.setValue('');
                this.showMessage('Credenciales guardadas de forma segura', false, 1500);
            },
            error: (err) => this.showMessage(err.error?.message || 'Error al guardar', true, 3000)
        });
    }

    public handleSyncBioTimeNow(): void {
        const { start, end } = this.bioTimeSyncRange.value;

        if ((start && !end) || (!start && end)) {
            this.showMessage('Seleccione un rango de fechas completo', true, 3000);
            return;
        }

        if (start && end && start > end) {
            this.showMessage('La fecha de inicio no puede ser mayor a la fecha fin', true, 3000);
            return;
        }

        this.loadingBioTimeSync.set(true);
        this.service.syncBioTimeNow({
            startDate: start ? this.formatDate(start) : null,
            endDate: end ? this.formatDate(end) : null,
        })
            .pipe(finalize(() => this.loadingBioTimeSync.set(false)))
            .subscribe({
                next: () => this.showMessage('Sincronización completada', false, 3000),
                error: (err) => this.showMessage(err.error?.message || 'Error en sincronización', true, 3000)
            });
    }

    private formatDate(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    private showMessage(message: string, isError: boolean = false, duration: number = 3000): void {
        this._snackBar.open(message, isError ? '❌' : '✅', {
            horizontalPosition: 'center',
            verticalPosition: 'top',
            panelClass: isError ? 'alert-error' : 'alert-success',
            duration
        });
    }
}