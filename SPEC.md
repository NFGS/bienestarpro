# SPEC — BienestarPro

**Versión:** 0.1 (borrador de Fase 0)
**Fecha:** 2026-10-08
**Estado:** En elaboración — se completa en las fases 1 y 2.

---

## 1. Visión y problema

El área de Bienestar al Aprendiz del Centro de Comercio y Turismo (SENA, Armenia) opera con poco personal para múltiples funciones, comunicación informal y planillas manuales, lo que genera reprocesos, entregas imperfectas de refrigerios y baja visibilidad de sus servicios.

**Regla de oro del sistema:** que la información correcta llegue a la persona correcta en el momento correcto, sin que nadie tenga que recordárselo.

**Objetivo general:** plataforma de operación integral de bienestar que automatice refrigerios, comunique multicanalmente (correo, WhatsApp, push) y centralice los procesos de comunicación institucional, con capacidad multi-centro para escalar a nivel nacional.

## 2. Alcance por módulos

| Orden | Módulo | Descripción | Fase objetivo |
|---|---|---|---|
| 1 | M4 Administración | Identidad, RBAC, multi-centro, auditoría | F4 |
| 2 | M9 Fichas por jornada | Directorio maestro: programas, fichas, jornadas (mañana/tarde/noche), instructores, aprendices | F4 |
| 3 | M1 Refrigerios | Eventos, cupos por reglas, confirmación, entrega con QR, auditoría | F4 |
| 4 | M2 Notificaciones | Hub multicanal con plantillas, preferencias, fallback y acuses | F4 |
| 5 | M10 Contactos de emergencia | Directorio restringido con auditoría de accesos | F4 |
| 6 | M6 Noticias y campañas | Publicación segmentada + analítica básica | F4 |
| 7 | M7 Encuestas | Pulso y encuestas con resultados agregados (doble uso: institucional e investigación) | F4 |
| 8 | M8 Reuniones y agenda | Programación, RSVP y recordatorios; sincronización de calendarios | F4 |
| 9 | M5 Informes | Planillas, exportables PDF/Excel, tablero | F4 (cierre) |
| 10 | M3 Portátiles | Registro de ingreso/salida (kiosco), visitantes, reportes | F5 |
| 11 | M11 IA/RAG | Asistente sobre normativa y clasificación de mensajes | F5 |

**Piloto:** 1–2 fichas + personal de bienestar, al cerrar el orden 9.

## 3. Actores y roles (RBAC)

| Rol | Alcance | Capacidades principales |
|---|---|---|
| Superadmin (TI) | Global | Configuración, tenants, auditoría |
| Coordinación Bienestar | Centro | Jornadas, cupos, publicar, informes, usuarios |
| Auxiliar Bienestar | Centro | Operar entregas, ajustar cupos, marcar con QR |
| Instructor / Director de ficha | Ficha | Ver su ficha, confirmar, resúmenes |
| Vocero / Subvocero | Ficha | Apoyo operativo del grupo |
| Aprendiz | Propio | Confirmar/no asistir, QR, historial |
| Cafetería | Centro | Consolidado diario, marcar preparación |
| Vigilante / Portería | Centro | Módulo portátiles en modo kiosco |
| Visitante | — | Entidad del registro (sin cuenta) |

Modelo RBAC + ABAC por ámbito (centro/programa/ficha) con Row-Level Security en PostgreSQL. TOTP obligatorio para administración y portería.

## 4. Arquitectura (alto nivel)

- **Monolito modular** NestJS por dominios; sidecar Python para ETL, informes e IA.
- **PWA offline-first** (caché Workbox + cola local) para portería y entrega de refrigerios.
- **Multi-tenant** desde el día 1: `centro_id` + RLS.
- **Hub de notificaciones**: patrón outbox + colas (BullMQ) + adaptadores intercambiables (correo, WhatsApp, push).
- **Despliegue piloto**: capas gratuitas (Neon, Upstash, Render, Vercel) con ruta de migración a VPS.
- Decisiones pendientes: ver `docs/adr/README.md` (13 ADRs planificadas).

## 5. Datos y privacidad

- PostgreSQL como fuente de verdad; `pgvector` reservado para la fase de IA.
- Ley 1581 de 2012: minimización, finalidad, retención definida, consentimientos.
- Datos sensibles (contactos de emergencia): acceso por rol mínimo + auditoría de lecturas.
- Encuestas: anonimato por diseño cuando aplique; sin `usuario_id` en modo anónimo.

## 6. Notificaciones

- Canales del MVP: correo (Gmail API/SMTP transaccional) + WhatsApp (ruta oficial, número de prueba en desarrollo) + push web (VAPID).
- Plantillas versionadas; WhatsApp utility sujeto a aprobación de Meta.
- Preferencias por usuario, horario silencioso, rate-limit anti-spam, registro `sent/delivered/read/failed`.
- Fallback en cascada: push → WhatsApp → correo.

## 7. Calidad y pruebas

- Gates: lint + typecheck + pruebas unitarias/integración; E2E Playwright para flujos críticos.
- ISO 25010 como marco de atributos de calidad (declarado en Fase 2).
- Observabilidad: logs estructurados, métricas, acuses de entrega.

## 8. Investigación (SENNOVA)

- Marco: proyecto de I+D+i en curso del grupo del centro; rol semillerista.
- Productos comprometidos: software (registro DNDA), ponencia/artículo, apropiación social (capacitaciones, cartilla), formación de semilleristas.
- Ética: consentimiento informado, protección de menores, datos sintéticos en desarrollo.
- Detalle en `docs/sennova/`.

## 9. Riesgos principales

| Riesgo | Mitigación |
|---|---|
| Alcance amplio | Rebanadas verticales, equipo de semilleristas, estimación en Fase 2 |
| Verificación Meta (WhatsApp) | Iniciar trámite temprano; número de prueba; adaptador |
| Datos personales (Ley 1581) | RBAC mínimo, auditoría, consentimientos |
| Hardware limitado para IA | IA en fase 5; embeddings locales pequeños; chat en nube |

## 10. Glosario

| Término | Significado |
|---|---|
| ADSO | Análisis y Desarrollo de Software (programa SENA) |
| ADR | Architecture Decision Record |
| RLS | Row-Level Security (aislamiento por fila en PostgreSQL) |
| SENNOVA | Sistema de I+D+i del SENA |
| TRL | Technology Readiness Level (madurez tecnológica) |
| Hub de notificaciones | Componente central que enruta mensajes a canales |

## Registro de cambios

| Versión | Fecha | Cambio |
|---|---|---|
| 0.1 | 2026-10-08 | Creación (Fase 0) |
