import { HttpEvent, HttpHandlerFn, HttpHeaders, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '@core/services/auth/auth.service';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export function authInterceptor(req: HttpRequest<any>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
    let newHeaders = new HttpHeaders();
    for (const head of req.headers.keys()) {
        const value = req.headers.get(head);
        if (value) {
            newHeaders = newHeaders.append(head, value);
        }
    }

    const apiUrl = (window as any).env?.apiUrl;
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    const authServuce = inject(AuthService);
    const token = authServuce.token;
    let baseApi = '';
    if (environment.production) {
        baseApi = apiUrl || `${protocol}//${hostname}:5000/api` || environment.apiUrl;
    } else {
        baseApi = environment.apiUrl;
    }
    
    let newReq = req.clone({
        url: `${baseApi}${req.url}`
    });

    if (token) {
        newHeaders = newHeaders.append('company', authServuce.activeCompany.value.toString());
        newHeaders = newHeaders.append('tenant', authServuce.activeTenant.value.toString());
        newHeaders = newHeaders.append('Authorization', `Bearer ${token}`);

        newReq = newReq.clone({
            headers: newHeaders,
        });
    }

    return next(newReq);
};