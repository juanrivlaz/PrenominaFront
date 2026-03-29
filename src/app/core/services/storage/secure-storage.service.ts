import { Injectable } from '@angular/core';

/**
 * Servicio de almacenamiento seguro que encripta datos sensibles
 * antes de almacenarlos en sessionStorage/localStorage
 */
@Injectable({
    providedIn: 'root',
})
export class SecureStorageService {
    private readonly encryptionKey: string;
    private memoryStorage: Map<string, string> = new Map();

    constructor() {
        // Usar clave persistente en sessionStorage o generar una nueva
        this.encryptionKey = this.getOrCreateSessionKey();
    }

    /**
     * Obtiene la clave de sesión existente o crea una nueva
     */
    private getOrCreateSessionKey(): string {
        const keyName = '_sk';
        const existingKey = window.sessionStorage.getItem(keyName);
        if (existingKey) {
            return existingKey;
        }

        const newKey = this.generateSessionKey();
        window.sessionStorage.setItem(keyName, newKey);
        return newKey;
    }

    /**
     * Almacena el token en sessionStorage (persiste durante la sesión)
     */
    public setToken(key: string, token: string): void {
        this.memoryStorage.set(key, token);
        try {
            const encrypted = this.encrypt(token);
            window.sessionStorage.setItem(key, encrypted);
        } catch {
            // Fallback a memoria si falla
        }
    }

    /**
     * Obtiene el token de sessionStorage o memoria
     */
    public getToken(key: string): string | null {
        // Primero intentar memoria (más rápido)
        const memoryToken = this.memoryStorage.get(key);
        if (memoryToken) {
            return memoryToken;
        }

        // Luego intentar sessionStorage
        try {
            const encrypted = window.sessionStorage.getItem(key);
            if (encrypted) {
                const token = this.decrypt(encrypted);
                this.memoryStorage.set(key, token); // Cachear en memoria
                return token;
            }
        } catch {
            // Ignorar errores
        }

        return null;
    }

    /**
     * Elimina el token de memoria y storage
     */
    public removeToken(key: string): void {
        this.memoryStorage.delete(key);
        window.sessionStorage.removeItem(key);
    }

    /**
     * Almacena datos sensibles encriptados en sessionStorage
     */
    public setSecureSession(key: string, value: string): void {
        try {
            const encrypted = this.encrypt(value);
            window.sessionStorage.setItem(key, encrypted);
        } catch {
            // Fallback a memoria si falla el storage
            this.memoryStorage.set(`session_${key}`, value);
        }
    }

    /**
     * Obtiene datos encriptados de sessionStorage
     */
    public getSecureSession(key: string): string | null {
        try {
            const encrypted = window.sessionStorage.getItem(key);
            if (!encrypted) {
                return this.memoryStorage.get(`session_${key}`) ?? null;
            }
            return this.decrypt(encrypted);
        } catch {
            return null;
        }
    }

    /**
     * Almacena datos no sensibles en sessionStorage (sin encriptar)
     */
    public setSession(key: string, value: string): void {
        window.sessionStorage.setItem(key, value);
    }

    /**
     * Obtiene datos de sessionStorage
     */
    public getSession(key: string): string | null {
        return window.sessionStorage.getItem(key);
    }

    /**
     * Almacena datos en localStorage (solo para datos no sensibles)
     */
    public setLocal(key: string, value: string): void {
        window.localStorage.setItem(key, value);
    }

    /**
     * Obtiene datos de localStorage
     */
    public getLocal(key: string): string | null {
        return window.localStorage.getItem(key);
    }

    /**
     * Limpia todos los datos de la sesión
     */
    public clearSession(): void {
        window.sessionStorage.clear();
        this.memoryStorage.clear();
    }

    /**
     * Limpia todo el almacenamiento
     */
    public clearAll(): void {
        window.sessionStorage.clear();
        window.localStorage.clear();
        this.memoryStorage.clear();
    }

    /**
     * Genera una clave única por sesión
     */
    private generateSessionKey(): string {
        const array = new Uint8Array(32);
        window.crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    /**
     * Encriptación básica usando XOR con la clave de sesión
     * Nota: Esto NO es criptografía fuerte, pero agrega una capa de ofuscación
     * Para datos altamente sensibles, usar Web Crypto API con AES-GCM
     */
    private encrypt(data: string): string {
        try {
            const encoded = btoa(encodeURIComponent(data));
            let result = '';
            for (let i = 0; i < encoded.length; i++) {
                const charCode = encoded.charCodeAt(i) ^ this.encryptionKey.charCodeAt(i % this.encryptionKey.length);
                result += String.fromCharCode(charCode);
            }
            return btoa(result);
        } catch {
            return data;
        }
    }

    /**
     * Desencripta datos
     */
    private decrypt(encryptedData: string): string {
        try {
            const decoded = atob(encryptedData);
            let result = '';
            for (let i = 0; i < decoded.length; i++) {
                const charCode = decoded.charCodeAt(i) ^ this.encryptionKey.charCodeAt(i % this.encryptionKey.length);
                result += String.fromCharCode(charCode);
            }
            return decodeURIComponent(atob(result));
        } catch {
            return encryptedData;
        }
    }
}
