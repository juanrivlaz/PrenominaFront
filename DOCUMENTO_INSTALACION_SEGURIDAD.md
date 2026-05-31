# Documento Técnico de Instalación — Enfoque de Seguridad
## Sistema Prenómina (Frontend Angular + API .NET 8)

> **Audiencia:** Departamento de Seguridad de la Información / Infraestructura.
> **Objetivo:** Detallar requisitos de instalación, superficie de exposición, flujos de red, gestión de secretos y controles de seguridad para autorizar y endurecer el despliegue.
> **Fecha:** 2026-05-29

---

## 1. Resumen de la Arquitectura

El sistema está compuesto por tres piezas que deben desplegarse y protegerse de forma coordinada:

| Componente | Tecnología | Rol | Plataforma de despliegue |
|---|---|---|---|
| **Frontend** | Angular 20.3.16 (SSR con Node/Express) | Interfaz web | Servidor web (Node) o estático tras IIS/Nginx |
| **API Backend** | .NET 8.0 Web API + EF Core 9 | Lógica de negocio y datos | IIS sobre Windows Server (puerto 5000) |
| **Base de datos** | SQL Server | Persistencia (2 BD: `apsisistemas` y `PrenominaApi`) | SQL Server (interno) |
| **Integración hardware** | Relojes biométricos ZKTeco (SDK `zkemkeeper`) vía `ZKBridgeApp.exe` | Captura de checadas | Red local / TCP 4370 |
| **Integración externa** | API BioTime (HTTP) | Sincronización de asistencia | HTTP saliente |

Flujo: **Navegador → Frontend (SSR) → API .NET → SQL Server**, con la API consultando **relojes ZK (TCP 4370)** y la **API BioTime (HTTP)**, y emitiendo notificaciones en tiempo real por **SignalR (WebSocket)**.

---

## 2. Requisitos de Software (Prerrequisitos de Instalación)

### 2.1 Servidor de la API (.NET)
- **Windows Server** (despliegue vía IIS — ver `PublishIIS.ps1`).
- **.NET 8.0 Runtime** + **ASP.NET Core Hosting Bundle** (`dotnet-hosting-9.0.x-win`).
- **IIS** con: `IIS-WebServerRole`, `IIS-WebServerManagementTools`, `IIS-ManagementConsole`.
- **.NET Framework 4.8** (requerido por el SDK COM de ZKTeco `zkemkeeper` usado por `ConnectZK`/`ZKBridgeApp`).
- **SDK ZKTeco / zkemkeeper** registrado en el servidor (COM) — solo si se usan relojes ZK directos.

### 2.2 Servidor del Frontend
- **Node.js 18+** (SSR se ejecuta con `node dist/prenomina/server/server.mjs`).
- Alternativa: servir el build estático tras un reverse proxy (IIS/Nginx) si no se requiere SSR.

### 2.3 Base de datos
- **SQL Server** (nivel de compatibilidad 120 para la BD principal). EF Core aplica migraciones automáticamente al arranque (`context.Database.Migrate()`).

> ⚠️ **Nota de seguridad:** la API ejecuta migraciones y un *seed* en cada arranque. La cuenta de BD usada necesita permisos DDL en `PrenominaApi`. Evaluar separar la cuenta de migración (DDL) de la cuenta de operación (DML).

---

## 3. Puertos y Flujos de Red (para reglas de Firewall)

| Origen | Destino | Puerto / Protocolo | Propósito | Exposición recomendada |
|---|---|---|---|---|
| Usuarios | Frontend | 80/443 TCP (HTTP/HTTPS) | Acceso web | Pública / interna según alcance |
| Frontend | API .NET | **5000 TCP** (HTTP) | Llamadas REST + SignalR | **Interna** (no exponer directo a Internet) |
| API .NET | SQL Server | 1433 TCP | Acceso a datos | Solo entre API y BD |
| API .NET | Relojes ZK | **4370 TCP** | Lectura de checadas | Red local / VLAN de dispositivos |
| API .NET | API BioTime | 80/443 TCP saliente | Sincronización asistencia | Saliente controlada |
| Usuarios | API (SignalR) | 5000 TCP `/socket-notification` | Notificaciones en tiempo real (WebSocket) | Interna |

El script `PublishIIS.ps1` abre **el puerto 5000 TCP entrante** en el firewall de Windows (`New-NetFirewallRule`). Revisar que esa regla esté limitada al segmento de red correcto.

---

## 4. Gestión de Secretos y Cuentas

### 4.1 Variables de entorno requeridas (producción)
La API **exige** estas variables a nivel **máquina** (`EnvironmentVariableTarget.Machine`) o lanza excepción al arrancar:

| Variable | Contenido | Sensibilidad |
|---|---|---|
| `SERVER_DB` | Servidor SQL | Media |
| `NAME_APSI_DB` | BD principal (`apsisistemas`) | Baja |
| `NAME_PRENOMINA_DB` | BD de prenómina (`PrenominaApi`) | Baja |
| `USER_DB` | Usuario SQL | **Alta** |
| `PASSWORD_DB` | Contraseña SQL | **Crítica** |
| `JWT_SECRET_KEY` | Clave de firma JWT (mín. 32 caracteres / 256 bits) | **Crítica** |

> El código valida que la clave JWT tenga ≥ 32 caracteres. Recomendado: clave aleatoria de 256 bits gestionada por el equipo de seguridad y rotada periódicamente.

### 4.2 Cuentas necesarias
- **Cuenta de servicio SQL** dedicada (NO usar `sa`). Permisos mínimos sobre `apsisistemas` (lectura/escritura) y `PrenominaApi` (incluye DDL para migraciones — ver §2.3).
- **App Pool de IIS** `PrenominaApiAppPool` (sin runtime administrado). Evaluar ejecutar bajo cuenta gestionada (gMSA) en lugar de `ApplicationPoolIdentity` si requiere acceso a recursos de red.
- Permisos NTFS: `IIS_IUSRS` con `ReadAndExecute` sobre el directorio publicado.

---

## 5. Controles de Seguridad Ya Implementados (a verificar en auditoría)

La aplicación incorpora varios controles que el departamento de seguridad debe validar como activos:

- **Autenticación JWT (Bearer)** con validación de issuer, audience, lifetime y firma; `ClockSkew` reducido a 1 min; tokens **no** persistidos en el servidor (`SaveToken = false`). Duración del token: 60 min.
- **Hashing de contraseñas** mediante `CustomPasswordHasher` (`IPasswordHasher`).
- **Rate limiting**:
  - Global: 100 solicitudes/min por IP (cola de 10).
  - Login (`/api/Auth`): 5 intentos/min por IP — mitiga fuerza bruta. Devuelve HTTP 429.
- **CORS restrictivo**: orígenes desde configuración (`baseUrls:webBase`), métodos y headers acotados, `AllowCredentials`.
- **Headers de seguridad (OWASP)** vía `SecurityHeadersMiddleware`: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Content-Security-Policy` restrictiva, `Permissions-Policy`, `Cache-Control: no-store`, y eliminación de `Server`/`X-Powered-By`.
- **Manejo centralizado de excepciones** (`ExceptionMiddleware`) — evita fuga de stack traces.
- **Multi-tenancy / aislamiento por empresa** (`CompanyTenantValidationFilter`, `CompanyTenantFilter`) mediante headers `company` y `tenant`.
- **Auditoría**: `audit_log` con resolución de `UserId` por `HttpContextAccessor`.
- **Logs**: Serilog a archivo (`logs/prenomina-api.log`, rotación diaria). Validar permisos y retención del directorio de logs.
- **Frontend**: tokens almacenados **cifrados** en `sessionStorage` (`SecureStorageService`), no en `localStorage`.

---

## 6. Hallazgos y Riesgos a Remediar Antes de Producción

> Estos puntos requieren acción del equipo de desarrollo/infra. Son **bloqueantes o de alta prioridad** para una instalación segura.

| # | Severidad | Hallazgo | Ubicación | Remediación |
|---|---|---|---|---|
| 1 | **Crítica** | **Credenciales `sa` y contraseña en texto plano** (`USER_DB=sa`, `PASSWORD_DB=desarrollo`) escritas en el script de despliegue. | `PublishIIS.ps1:30-31` | Eliminar credenciales del script; cargarlas fuera de control de versiones (gestor de secretos / variables seguras). Rotar la contraseña expuesta. |
| 2 | **Crítica** | **Clave JWT por defecto presente en `appsettings.json`** (versionado en el repo). | `appsettings.json:36` | Mover exclusivamente a `JWT_SECRET_KEY`; eliminar la clave del archivo y rotarla. El código ya soporta lectura por env var. |
| 3 | **Alta** | **HTTPS/HSTS deshabilitados** — `UseHttpsRedirection`/`UseHsts` están comentados; la API escucha HTTP en 5000. | `Program.cs:333-337` | Terminar TLS en IIS/reverse proxy o habilitar HTTPS; activar HSTS. No exponer HTTP a redes no confiables. |
| 4 | **Alta** | **Conexión a SQL sin cifrado validado** — se usa `TrustServerCertificate=True` y `Encrypt=True` está comentado. | `Program.cs:72` | Habilitar `Encrypt=True` con certificado válido en SQL Server; evitar `TrustServerCertificate`. |
| 5 | **Alta** | **Swagger/OpenAPI habilitado siempre** (también en producción). | `Program.cs:324-325` | Restringir Swagger a entornos no productivos o protegerlo tras autenticación/red interna. |
| 6 | **Media** | **`AllowedHosts: "*"`** — sin restricción de Host header. | `appsettings.json:33` | Especificar los hostnames válidos. |
| 7 | **Media** | **Migraciones + seed automáticos en arranque** con cuenta DDL. | `Program.cs:319-320` | Separar despliegue de esquema de la ejecución; usar cuenta DML en runtime. |
| 8 | **Baja** | URL de **devtunnel** y IP local en configuración de frontend. | `src/environments/environment.ts:3-4` | Confirmar que `environment.prod.ts` es el usado en build de producción y no expone túneles de desarrollo. |
| 9 | **Media** | **Controlador `WeatherForecast`** de plantilla presente. | `Controllers/WeatherForecastController.cs` | Eliminar endpoints de ejemplo no usados. |

---

## 7. Lista de Verificación de Hardening (pre-producción)

- [ ] Secretos (`USER_DB`, `PASSWORD_DB`, `JWT_SECRET_KEY`) en variables de entorno de máquina o gestor de secretos; **ninguno** en repositorio.
- [ ] Rotar clave JWT y contraseña de BD expuestas en el repo.
- [ ] TLS habilitado (HTTPS) en frontend y API; HSTS activo; redirección HTTP→HTTPS.
- [ ] `Encrypt=True` en cadenas de conexión con certificado válido en SQL Server.
- [ ] Cuenta SQL dedicada con privilegios mínimos (sin `sa`).
- [ ] Puerto 5000 restringido a la red interna; API no publicada directamente a Internet.
- [ ] VLAN/segmento dedicado para relojes ZK (TCP 4370); acceso saliente a BioTime controlado.
- [ ] Swagger deshabilitado o protegido en producción.
- [ ] `AllowedHosts` con dominios explícitos; `baseUrls:webBase` con los orígenes CORS reales.
- [ ] Retención, permisos y monitoreo del directorio `logs/`.
- [ ] Backups y plan de recuperación de las BD `apsisistemas` y `PrenominaApi`.
- [ ] Revisión de la regla de firewall creada por `PublishIIS.ps1` (alcance del puerto 5000).
- [ ] Eliminar `WeatherForecastController` y artefactos de plantilla.

---

## 8. Datos Personales / Cumplimiento

El sistema procesa **datos personales de empleados** (asistencia, biometría/checadas vía ZKTeco, nómina, contratos en PDF). Consideraciones para el equipo de seguridad/legal:

- Datos biométricos y de asistencia → tratar como **datos sensibles**; aplicar cifrado en tránsito y reposo.
- Documentos generados (PDFs de contratos, recibos) almacenados en el servidor de la API — controlar acceso NTFS y retención.
- Registrar tratamiento conforme a normativa aplicable (p. ej. LFPDPPP en México) dado el contexto del proyecto (`es-MX`).

---

### Anexo: Componentes de código relevantes
- Arranque y configuración de seguridad: `PrenominaApi/Program.cs`
- Headers de seguridad: `PrenominaApi/Middlewares/SecurityHeadersMiddleware.cs`
- Clave JWT: `PrenominaApi/Configuration/AuthorizationConstants.cs`
- Login + rate limit: `PrenominaApi/Controllers/AuthController.cs`
- Sincronización BioTime: `PrenominaApi/Services/Prenomina/BioTimeSyncService.cs`, `Jobs/BioTimeSyncJob.cs`
- Relojes ZK: `ConnectZK/ConnectZK.cs`, `ZKBridgeApp/`
- Despliegue IIS: `PrenominaApi/PublishIIS.ps1`
- Almacenamiento seguro de token (frontend): `src/app/core/services/storage/secure-storage.service.ts`
