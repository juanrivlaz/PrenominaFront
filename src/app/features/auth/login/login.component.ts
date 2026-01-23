import { ChangeDetectionStrategy, Component, inject, signal, ViewEncapsulation, WritableSignal } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, Validators } from '@angular/forms';
import { FormGroup, FormControl } from '@angular/forms';
import { MaterialModule } from '../../../shared/modules/material/material.module';
import { finalize, merge } from 'rxjs';
import { Router, RouterLink } from '@angular/router';
import { AppConfigService } from '@core/services/app-config/app-config.service';
import { AuthService } from '../auth.service';
import { AuthService as AuthSysService } from '@core/services/auth/auth.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-auth-login',
  imports: [
    CommonModule,
    MaterialModule,
    ReactiveFormsModule,
    RouterLink,
    MatProgressSpinnerModule
  ],
  providers: [AuthService],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class LoginComponent {
  private readonly _snackBar = inject(MatSnackBar);
  public logo = '';
  public loginForm: FormGroup;
  public emailError: WritableSignal<string> = signal('');
  public passwordError: WritableSignal<string> = signal('');
  public loading: WritableSignal<boolean> = signal(false);

  constructor(
    private readonly appConfigService: AppConfigService,
    private readonly service: AuthService,
    private readonly authSysService: AuthSysService,
    private readonly router: Router
  ) {
    this.logo = appConfigService.settings.logo;
    this.loginForm = new FormGroup({
      email: new FormControl('', {
        validators: [Validators.required, Validators.email]
      }),
      password: new FormControl('', {
        validators: [Validators.required]
      }),
    });

    const emailControl = this.loginForm.get('email');
    merge(emailControl!.statusChanges, emailControl!.valueChanges).pipe(takeUntilDestroyed())
    .subscribe(() => this.processEmailsErrors());

    const passwordControl = this.loginForm.get('password');
    merge(passwordControl!.statusChanges, passwordControl!.valueChanges).pipe(takeUntilDestroyed())
    .subscribe(() => this.processPasswordErrors());

    this.appConfigService.onSettingsObserver.subscribe((setting) => {
        this.logo = setting.logo;
    });
  }

  public get hasEmailError(): boolean | undefined {
    return this.loginForm.get('email')?.invalid;
  }

  public get hasPasswordError(): boolean | undefined {
    return this.loginForm.get('password')?.invalid;
  }

  public submit(): void {
    this.loading.set(true);
    this.service.login(this.loginForm.value).pipe(
      finalize(() => {
        this.loading.set(false);
      })
    ).subscribe({
      next: (response) => {
        if (response.url) {
          this.router.navigate([response.url]);
        } else {
          this.authSysService.logAuth();

          this._snackBar.open('Lo sentimos no tienes permisos, ponte en contacto con un administrador', undefined, {
            horizontalPosition: 'center',
            verticalPosition: 'top',
            panelClass: 'alert-error',
            duration: 3000
          });
        }
      },
      error: (err) => {
        console.log(err);
        const message = err.error?.message || 'Ocurrió un error, por favor intentalo más tarde';

        this._snackBar.open(message, undefined, {
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: 'alert-error',
          duration: 3000
        });
      }
    });
  }

  private processEmailsErrors(): void {
    const email = this.loginForm.get('email');
    if (email?.hasError('required')) {
      this.emailError.set('El correo es requerido');
    } else if (email?.hasError('email')) {
      this.emailError.set('El correo no es valido');
    } else {
      this.emailError.set('');
    }
  }

  private processPasswordErrors(): void {
    const password = this.loginForm.get('password');
    if (password?.hasError('required')) {
      this.passwordError.set('La contraseña es requerida');
    } else {
      this.passwordError.set('');
    }
  }
}
