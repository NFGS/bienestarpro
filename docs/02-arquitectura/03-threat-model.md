# Modelo de Amenazas (Threat Model) — BienestarPro

**Estado:** Borrador v0.1 — Fase 2 (arquitectura). Pendiente de validación con el discovery y de la revisión de seguridad previa a producción.

**Fecha:** 2026-10-09

**Método:** STRIDE por componente, con inventario de activos, límites de confianza y mapa OWASP Top 10 (2021). Los controles se amarran a los requisitos del ERS (`docs/01-requisitos/01-ers-borrador-v0.1.md`) y a las decisiones de los ADRs.

---

## 1. Alcance y método

Se modelan las amenazas de la arquitectura del piloto: PWA offline-first, API core (NestJS), hub de notificaciones (ADR-0004), PostgreSQL multi-tenant con RLS (ADR-0003), identidad propia con TOTP (ADR-0006), modo kiosco de portería (Fase 5, diseño previsto, ADR-0008) e integraciones externas (correo, WhatsApp, push).

**Límites de confianza principales:**

1. Dispositivo del usuario (navegador, cola IndexedDB) — no confiable.
2. Red (TLS) — no confiable.
3. API core y sidecar — confiables si el despliegue es correcto.
4. Base de datos con RLS — confiable (última red de defensa del aislamiento).
5. Proveedores externos (Meta/WhatsApp, correo, push) — semiconfiables; sus webhooks se verifican.

**Criterio de severidad:** Alta = afecta datos personales, dinero o la operación en jornada; Media = afecta la operación interna o la trazabilidad; Baja = molestias o casos improbables.

## 2. Inventario de activos y superficies de ataque

| # | Activo | Por qué importa | Superficie principal |
|---|---|---|---|
| A1 | Datos de aprendices e instructores (fichas, documentos) | Ley 1581; base de la operación | API, exportables, base de datos |
| A2 | Contactos de emergencia | Datos sensibles de terceros | API restringida, auditoría (CU-24) |
| A3 | Registros de entrega de refrigerios (y QR) | Dinero y control del beneficio | PWA de entrega, cola offline |
| A4 | Respuestas de encuestas | Anonimato prometido e investigación | API de encuestas |
| A5 | Sesiones y roles (RBAC/ABAC, TOTP) | Llave de todo lo anterior | Login, API de administración |
| A6 | Hub de notificaciones y plantillas | La "regla de oro" del sistema | Colas, adaptadores, webhooks |
| A7 | Registros de auditoría | Trazabilidad y no repudio | API de auditoría (solo lectura) |
| A8 | Exportables PDF/Excel | Copias de datos fuera de control | Endpoints de informes |
| A9 | Aislamiento entre centros (RLS) | Requisito de replicación nacional | Base de datos, contexto de sesión |

## 3. Amenazas STRIDE por componente

### 3.1 PWA de entrega (offline) y cliente web

| ID | Categoría | Amenaza concreta | Sev. | Mitigación | Requisito |
|---|---|---|---|---|---|
| T-01 | Spoofing | Un tercero presenta el QR de otro aprendiz para reclamar su refrigerio. | Alta | QR ligado a aprendiz y evento, de un solo uso por evento (anti-repetición); verificación visual del auxiliar; registro de quién escanea. | RF-17 |
| T-02 | Tampering | Manipulación de la cola local (IndexedDB) para inyectar entregas falsas. | Alta | UUID por operación generado en el cliente; cola por sesión de auxiliar autenticado; el servidor valida derecho y duplicados al sincronizar; anomalías visibles en el cierre. | RF-17, RNF-02 |
| T-03 | Repudiation | El auxiliar niega una entrega registrada (o un aprendiz niega haberla recibido). | Media | Registro con usuario, dispositivo, fecha y UUID; auditoría inmutable; QR y confirmación visual. | RF-17, RF-04 |
| T-04 | Information disclosure | Datos de aprendices visibles si el dispositivo queda abierto o se pierde. | Media | Cachear solo lo indispensable del día; limpieza de caché al cerrar evento/sesión; nunca cachear contactos de emergencia. | RNF-03 |
| T-05 | Denial of service | La app se cierra o el dispositivo falla antes de sincronizar. | Alta | Escritura inmediata en IndexedDB; sincronización idempotente al recuperar red; prueba de recuperación. | RNF-02 |
| T-06 | Elevation of privilege | Cliente manipulado para ejecutar acciones fuera de su rol. | Alta | El cliente no decide permisos: toda autorización se valida en el servidor (guards + RLS). | RNF-07 |

### 3.2 API core (NestJS)

| ID | Categoría | Amenaza concreta | Sev. | Mitigación | Requisito |
|---|---|---|---|---|---|
| T-07 | Spoofing | Robo o reutilización de tokens de sesión. | Alta | Tokens de acceso cortos, refresh rotativo, revocación; TOTP en roles sensibles. | RF-01, RNF-08 |
| T-08 | Tampering | IDOR: cambiar identificadores para operar sobre fichas o centros ajenos. | Alta | Validación de ámbito en cada operación; RLS como red de seguridad; pruebas de integración por rol. | RNF-07 |
| T-09 | Repudiation | Acciones administrativas sin traza (ajustes de cupo, cambios de rol). | Media | Auditoría de acciones críticas, no editable desde la aplicación. | RF-04, RF-16 |
| T-10 | Information disclosure | Sobre-exposición de datos en respuestas (campos de más). | Media | DTOs explícitos por caso de uso; contacto de emergencia solo por endpoint auditado. | RF-29 |
| T-11 | Denial of service | Picos de tráfico en convocatorias masivas. | Media | Envíos por colas (ADR-0004); rate-limit; timeouts; prueba de carga con el volumen de línea base. | RNF-05 |
| T-12 | Elevation of privilege | Endpoint sin guard de rol o ámbito mal configurado. | Alta | Guards por rol y ámbito + pruebas de autorización en CI (matriz de permisos). | RNF-07, RF-02 |

### 3.3 Hub de notificaciones

| ID | Categoría | Amenaza concreta | Sev. | Mitigación | Requisito |
|---|---|---|---|---|---|
| T-13 | Spoofing | Webhooks falsificados de proveedor (acuses falsos de entrega/lectura). | Media | Verificación de firma/secreto por proveedor; allowlist de IP cuando aplique. | RF-26 |
| T-14 | Tampering | Alteración de plantillas para inyectar contenido o phishing interno. | Media | Edición restringida a roles de comunicación; versionado de plantillas; auditoría. | RF-23 |
| T-15 | Repudiation | "El aviso nunca llegó" sin evidencia. | Media | Registro `sent/delivered/read/failed` por intento y canal. | RNF-10, RF-26 |
| T-16 | Information disclosure | Enviar datos sensibles por canales externos (p. ej. contacto de emergencia por WhatsApp). | Alta | Plantillas con contenido mínimo; prohibido incluir datos sensibles; deep-links autenticados. | RNF-03, RN-07 |
| T-17 | Denial of service | Spam saliente que bloquee el número de WhatsApp del centro. | Media | Rate-limit anti-spam, horario silencioso, alertas de volumen anómalo. | RNF-09 |
| T-18 | Elevation of privilege | Uso del hub para enviar mensajes arbitrarios "como" otro usuario. | Media | Los envíos nacen de eventos de dominio autorizados; no existe endpoint de envío libre. | RF-22 |

### 3.4 Base de datos multi-tenant (RLS)

| ID | Categoría | Amenaza concreta | Sev. | Mitigación | Requisito |
|---|---|---|---|---|---|
| T-19 | Tampering | Modificación de datos de otro centro (contexto de sesión incorrecto). | Alta | RLS por `centro_id`; pruebas automatizadas de aislamiento; migraciones revisadas. | RNF-07 |
| T-20 | Information disclosure | Fuga entre centros por consulta sin filtro o cuenta privilegiada mal usada. | Alta | RLS + privilegio mínimo del usuario de aplicación; superadmin auditado. | RNF-07 |
| T-21 | Denial of service | Agotamiento del límite de conexiones de la capa gratuita. | Media | Pooling de conexiones; alertas; criterio de migración a VPS (ADR-0007). | RNF-05 |
| T-22 | Elevation of privilege | Usuario de aplicación con permisos DDL/administrativos. | Media | Usuario de aplicación con permisos mínimos; migraciones con usuario separado. | RNF-07 |

### 3.5 Identidad y sesiones

| ID | Categoría | Amenaza concreta | Sev. | Mitigación | Requisito |
|---|---|---|---|---|---|
| T-23 | Spoofing | Credenciales débiles o filtradas. | Alta | Argon2id; bloqueo por intentos; TOTP obligatorio en administración y portería. | RF-01, RF-05 |
| T-24 | Tampering | Manipulación de claims del token. | Alta | Firma verificada; claims mínimos; rotación de refresh. | RF-01 |
| T-25 | Information disclosure | Enumeración de usuarios (mensajes que revelan si la cuenta existe). | Baja | Error genérico en credenciales inválidas (criterio de RF-01). | RF-01 |
| T-26 | Denial of service | Fuerza bruta contra cuentas. | Media | Bloqueo temporal + rate-limit por IP y cuenta. | RF-01, RNF-08 |

### 3.6 Modo kiosco de portería (Fase 5, diseño previsto)

| ID | Categoría | Amenaza concreta | Sev. | Mitigación | Requisito |
|---|---|---|---|---|---|
| T-27 | Spoofing | Uso de la sesión de kiosco por una persona no autorizada. | Media | Sesión de portería con TOTP, tiempo limitado y pantalla fija; cierre automático. | RNF-08 |
| T-28 | Tampering | Registro de portátiles manipulado. | Media | Auditoría de cada registro; confirmación visual del vigilante; reportes de anomalías. | RF-04 |
| T-29 | Denial of service | Kiosco inoperante sin red en hora pico. | Alta | Offline-first con cola local e idempotencia (ADR-0008). | RNF-02 |

### 3.7 Exportables e informes

| ID | Categoría | Amenaza concreta | Sev. | Mitigación | Requisito |
|---|---|---|---|---|---|
| T-30 | Information disclosure | Exportaciones con datos personales que salen del control del sistema. | Alta | Permisos por rol; registro de exportaciones en auditoría; los exportables estándar no incluyen contactos de emergencia. | RF-40, RNF-03 |
| T-31 | Repudiation | Exportación no trazada. | Baja | Cada exportación queda auditada (usuario, fecha, filtros). | RF-04 |

### 3.8 Integraciones externas y dependencias

| ID | Categoría | Amenaza concreta | Sev. | Mitigación | Requisito |
|---|---|---|---|---|---|
| T-32 | Denial of service | Caída o bloqueo del proveedor de WhatsApp/correo/push. | Media | Cascada de fallback (ADR-0004); reintentos; monitoreo de fallos. | RF-22, RNF-10 |
| T-33 | Information disclosure | Tratamiento de datos por terceros sin base jurídica (piloto en capas gratuitas). | Alta | Minimización; evaluación ética antes de datos reales; criterio de residencia (ADR-0007 D3-D4); riesgo residual documentado. | RNF-06 |

## 4. Mapa OWASP Top 10 (2021)

| Categoría | Amenazas relacionadas | Controles clave |
|---|---|---|
| A01 Broken Access Control | T-06, T-08, T-12, T-19, T-20 | RLS, guards por rol y ámbito, pruebas de autorización |
| A02 Cryptographic Failures | T-07, T-16, T-23, T-24 | TLS, Argon2id, cifrado en reposo, secretos fuera del repo |
| A03 Injection | (transversal) | ORM con consultas parametrizadas, validación de entrada |
| A04 Insecure Design | T-01, T-02, T-17, T-30 | Este threat model, ADRs, rate-limits, QR de un solo uso |
| A05 Security Misconfiguration | T-22, T-24 | Revisión de configuración, headers seguros, privilegio mínimo |
| A06 Vulnerable Components | (transversal) | Auditoría de dependencias en CI |
| A07 Identification/Auth Failures | T-23, T-25, T-26 | Bloqueo, TOTP, tokens cortos, error genérico |
| A08 Software/Data Integrity Failures | T-13, T-14 | Verificación de webhooks, versionado de plantillas |
| A09 Logging/Monitoring Failures | T-03, T-09, T-15 | Auditoría + observabilidad (RNF-11) |
| A10 SSRF | — (no aplica en piloto) | Vigilancia cuando llegue IA/RAG (Fase 5) |

## 5. Riesgos residuales y controles pendientes

| # | Riesgo residual | Estado | Cuándo se resuelve |
|---|---|---|---|
| R-01 | Datos personales en proveedores de capas gratuitas (T-33) | Aceptado con mitigaciones (minimización + evaluación ética) | Antes de operar con datos reales; migración según ADR-0007 |
| R-02 | Reglas exactas de retención de datos | Por confirmar en Fase 0 | Discovery con el área y ética SENNOVA |
| R-03 | Decisión de cifrado a nivel de campo para contactos de emergencia | Por confirmar | Con este threat model validado + guía PI |
| R-04 | Verificación de firma de webhooks de WhatsApp | Pendiente | Al definir la estrategia WhatsApp (ADR-0001) |
| R-05 | Limpieza de caché del cliente tras cierre de evento | Por definir en diseño de Fase 4 | Diseño de la PWA |
| R-06 | Revisión de headers y configuración segura del despliegue | Pendiente | Checklist previo a producción del piloto |

## 6. Requisitos de verificación (cómo se prueba cada control)

1. **Aislamiento multi-tenant:** pruebas automatizadas que intentan leer/escribir datos de otro centro (esperado: cero filas o error) — RNF-07.
2. **Autorización por rol y ámbito:** matriz de permisos ejecutada como pruebas de integración por cada rol del SPEC §3.
3. **Auditoría de datos sensibles:** verificación de que el 100% de las lecturas de contactos de emergencia generan registro — RNF-03.
4. **QR de un solo uso:** prueba de reutilización de un QR en el mismo evento (esperado: rechazo).
5. **Sincronización offline:** registros sin red sincronizados sin pérdida ni duplicados — RNF-02.
6. **Cascada e idempotencia del hub:** fallo simulado del canal primario; reenvío del mismo mensaje — RNF-09, RNF-10.
7. **Rate-limit y horario silencioso:** prueba de límites por usuario y canal — RNF-09.
8. **Checklist OWASP de despliegue:** headers, TLS, secretos, permisos de base — previo al piloto.

## Registro de cambios

| Versión | Fecha | Cambio |
|---|---|---|
| 0.1 | 2026-10-09 | Creación en Fase 2 (arquitectura) |
