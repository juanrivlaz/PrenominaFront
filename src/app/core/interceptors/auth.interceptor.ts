import { HttpEvent, HttpHandlerFn, HttpHeaders, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '@core/services/auth/auth.service';
import { SecureConfigService } from '@core/services/config/secure-config.service';
import { Observable } from 'rxjs';

export function authInterceptor(req: HttpRequest<any>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
    const secureConfig = inject(SecureConfigService);
    const authService = inject(AuthService);
    const token = authService.token;

    // Usar la URL segura del servicio de configuración
    const baseApi = secureConfig.apiUrl;

    // Clonar headers existentes de forma segura
    let newHeaders = new HttpHeaders();
    for (const head of req.headers.keys()) {
        const value = req.headers.get(head);
        if (value) {
            newHeaders = newHeaders.append(head, value);
        }
    }

    let newReq = req.clone({
        url: `${baseApi}${req.url}`
    });

    if (token) {
        // Sanitizar valores antes de agregarlos como headers
        const companyValue = sanitizeHeaderValue(authService.activeCompany.value.toString());
        const tenantValue = sanitizeHeaderValue(authService.activeTenant.value.toString());

        newHeaders = newHeaders.append('company', companyValue);
        newHeaders = newHeaders.append('tenant', tenantValue);
        newHeaders = newHeaders.append('Authorization', `Bearer ${token}`);

        newReq = newReq.clone({
            headers: newHeaders,
        });
    }

    return next(newReq);
}

/**
 * Sanitiza valores de headers para prevenir header injection
 */
function sanitizeHeaderValue(value: string): string {
    if (!value || typeof value !== 'string') {
        return '';
    }
    // Remover caracteres de control y newlines que podrían permitir header injection
    return value.replace(/[\r\n\t\x00-\x1f\x7f]/g, '').trim();
}
