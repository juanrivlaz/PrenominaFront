import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

/**
 * Servicio de configuración segura que valida y sanitiza URLs
 * para prevenir ataques SSRF e inyección de código
 */
@Injectable({
    providedIn: 'root',
})
export class SecureConfigService {
    private _apiUrl: string = '';
    private _isInitialized: boolean = false;

    constructor() {
        this.initialize();
    }

    private initialize(): void {
        if (this._isInitialized) return;

        if (environment.production) {
            const runtimeApiUrl = this.getRuntimeApiUrl();
            this._apiUrl = this.validateAndSanitizeUrl(runtimeApiUrl) || this.buildDefaultApiUrl();
        } else {
            this._apiUrl = environment.apiUrl;
        }

        this._isInitialized = true;
    }

    /**
     * Obtiene la URL de la API de forma segura
     */
    public get apiUrl(): string {
        return this._apiUrl;
    }

    /**
     * Obtiene la URL del socket de forma segura
     */
    public get socketUrl(): string {
        return this._apiUrl.replace('/api', '/socket-notification');
    }

    /**
     * Obtiene la URL del runtime config de forma segura
     */
    private getRuntimeApiUrl(): string | null {
        try {
            // Verificar que window.env existe y es un objeto
            const env = (window as Window & { env?: { apiUrl?: string } }).env;
            if (env && typeof env === 'object' && typeof env.apiUrl === 'string') {
                return env.apiUrl;
            }
        } catch {
            console.warn('SecureConfigService: Unable to read runtime config');
        }
        return null;
    }

    /**
     * Construye la URL por defecto basada en el hostname actual
     */
    private buildDefaultApiUrl(): string {
        const protocol = window.location.protocol;
        const hostname = window.location.hostname;
        return `${protocol}//${hostname}:5000/api`;
    }

    /**
     * Valida y sanitiza una URL para prevenir inyecciones
     * @param url URL a validar
     * @returns URL sanitizada o null si es inválida
     */
    private validateAndSanitizeUrl(url: string | null): string | null {
        if (!url || typeof url !== 'string') {
            return null;
        }

        try {
            const parsedUrl = new URL(url);

            // Solo permitir protocolos seguros
            if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
                console.warn('SecureConfigService: Invalid protocol detected');
                return null;
            }

            // Validar que no sea una IP privada peligrosa (prevenir SSRF)
            const hostname = parsedUrl.hostname.toLowerCase();
            const dangerousPatterns = [
                /^localhost$/i,
                /^127\./,
                /^10\./,
                /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
                /^192\.168\./,
                /^0\./,
                /^169\.254\./, // Link-local
                /^::1$/,
                /^fc00:/i,
                /^fe80:/i,
            ];

            // En producción, bloquear IPs privadas excepto las configuradas explícitamente
            if (environment.production) {
                const isPrivateIp = dangerousPatterns.some(pattern => pattern.test(hostname));
                if (isPrivateIp) {
                    // Permitir solo si el hostname actual también es privado (red interna)
                    const currentHostname = window.location.hostname;
                    const isCurrentPrivate = dangerousPatterns.some(pattern => pattern.test(currentHostname));
                    if (!isCurrentPrivate) {
                        console.warn('SecureConfigService: Private IP not allowed in production');
                        return null;
                    }
                }
            }

            // Reconstruir URL sanitizada
            return `${parsedUrl.protocol}//${parsedUrl.host}${parsedUrl.pathname}`;
        } catch {
            console.warn('SecureConfigService: Invalid URL format');
            return null;
        }
    }
}
