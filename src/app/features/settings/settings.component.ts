import { CommonModule } from "@angular/common";
import { Component, inject, model, OnInit, ViewEncapsulation } from "@angular/core";
import { MatChipsModule } from "@angular/material/chips";
import { MatDividerModule } from "@angular/material/divider";
import { MatSelectModule } from "@angular/material/select";
import { FormControl, FormsModule, ReactiveFormsModule, Validators } from "@angular/forms";
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

@Component({
    selector: 'app-settings',
    imports: [
        CommonModule,
        MaterialModule,
        MatChipsModule,
        MatDividerModule,
        NgxColorsModule,
        FormsModule,
        MatSelectModule,
        EditorModule,
        ReactiveFormsModule
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
    public clockInterval: FormControl;
    public loadingClockInterval = model<boolean>(false);
    public loadingTypeTenant = model<boolean>(false);
    public loadingTypeDayOffReport = model<boolean>(false);
    public typeTenantsOptions: Array<{ id: number, label: string }>;
    public timeZoneOptions: Array<{ id: string, label: string }>;
    public initConfigEditor = {
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
    public minToOvertimeReport: FormControl;
    public loadingMinToOvertimeReport = model<boolean>(false);

    public constructor(
        private appConfigService: AppConfigService,
        private authService: AuthService,
        private service: SettingsService,
    ) {
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
        this.minToOvertimeReport = new FormControl(30, [Validators.required, Validators.min(1)]);
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
            },
            error: (err) => {
                const message = err.error?.message || 'Ocurrió un error, por favor intentalo más tarde';
                this.showMessage(message, true, 3000);
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

    private showMessage(message: string, isError: boolean = false, duration: number = 3000): void {
        this._snackBar.open(message, isError ? '❌' : '✅', {
            horizontalPosition: 'center',
            verticalPosition: 'top',
            panelClass: isError ? 'alert-error' : 'alert-success',
            duration
        });
    }
}