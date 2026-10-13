# Plan de Construcción — Fase 4 (Kickoff) — BienestarPro

**Estado:** Borrador v0.1 — abre la Fase 4 (Construcción + piloto).

**Fecha:** 2026-10-13

**Decisión que lo gobierna:** ADR-0013 (alcance del piloto: 9 módulos, rebanadas verticales, orden de construcción).

---

## 1. Propósito

Convertir los borradores de requisitos, arquitectura y UX en software verificable, por **rebanadas verticales**: cada rebanada cierra de punta a punta (datos, API, UI, pruebas y evidencia) antes de abrir la siguiente.

## 2. Orden de construcción (ADR-0013)

| # | Rebanada | Depende de | Primera entrega |
|---|---|---|---|
| 0 | Infraestructura base (workspace, gates, contratos) | — | Esta semana |
| 1 | M4 Administración (identidad, RBAC, centros, auditoría, TOTP) | 0 | Inicio + usuarios/roles |
| 2 | M9 Fichas por jornada | 1 | Directorio maestro |
| 3 | M1 Refrigerios | 2 | Evento → convocatoria → entrega QR → cierre |
| 4 | M2 Notificaciones (hub multicanal) | 3 | Convocatoria multicanal con acuses |
| 5 | M10 Contactos de emergencia | 2 | Directorio restringido auditado |
| 6 | M6 Noticias y campañas | 4 | Publicación segmentada |
| 7 | M7 Encuestas | 2 | Encuesta anónima de punta a punta |
| 8 | M8 Reuniones y agenda | 4 | Reunión + RSVP |
| 9 | M5 Informes | 3–8 | Planilla, informe y tablero |
| — | Piloto (1–2 fichas) | 9 | Operación real supervisada |

**Estado (2026-10-13):** **rebanada 1 (M4 Administración) completa** — RF-01 login (Argon2id + bloqueo), RF-02 usuarios/roles con UI, RF-03 centros (API; UI de superadmin cuando exista caso multi-centro), RF-04 auditoría consultable con UI, RF-05 TOTP obligatorio para administración/portería (enrolamiento asistido con QR, verificación en login y guard de cumplimiento). Pruebas: API 13/13, web 2/2; evidencia gráfica del flujo TOTP y de la administración en `docs/04-construccion/evidencias/`. Nota: el usuario demo quedó con TOTP activado para la evidencia; para restablecerlo: `UPDATE users SET totp_secret=NULL, totp_enabled_at=NULL WHERE email='coordinacion.demo@bienestarpro.local';`.

**Estado (2026-10-14):** rebanada 2 (M9 Fichas por jornada) — **backend completo con RLS multi-tenant real**: programas, fichas (jornadas mañana/tarde/noche), aprendices con retiro auditado, instructores por ficha y consentimientos versionados/revocables (RF-06 a RF-11). Migraciones: 0003 (tablas), 0004+0006 (políticas RLS endurecidas con NULLIF), 0005 (rol de aplicación no-superuser). Pruebas: 18/18 con aislamiento verificado entre dos centros y fail-closed sin contexto. Hallazgos documentados en las migraciones: (1) el bootstrap superuser de Docker no puede degradarse — la API usa un rol dedicado `bienestarpro_app`; (2) tras `set_config` local el GUC queda en cadena vacía — las políticas usan `NULLIF`. Pendiente: UI del directorio (lista/detalle de fichas) y evidencia gráfica.

## 3. Rebanada 0 — Infraestructura base (alcance inmediato)

- [x] `docs/04-construccion/` y este plan.
- [x] Monorepo pnpm: `pnpm-workspace.yaml`, `package.json` raíz, `engines`, `.nvmrc`, `.editorconfig`.
- [x] Shell web (`apps/web`): React 19 + TypeScript + Vite (base de la PWA; Workbox entra con la rebanada 3, cuando hay flujos offline que cachear).
- [x] Esqueleto API (`apps/api`): NestJS 12 + Fastify, módulo de salud (prueba 1/1 y arranque real verificado con curl a `/api/health`).
- [x] Esqueleto sidecar (`apps/ai`): FastAPI con `/health` (pytest 1/1, ruff limpio).
- [x] `packages/contracts`: primera superficie (`HealthResponse` y `API_PREFIX`).
- [x] Gates en verde: `pnpm -r lint`, `pnpm -r build`, `pnpm -r typecheck`, `pnpm -r test` + ruff/pytest.
- [x] CI (GitHub Actions): lint + build + tipos + pruebas en cada push (Node 24 y Python 3.14).

**Notas de tooling:** las pruebas de la API usan **Vitest** (NestJS 12 publica paquetes ESM y Jest 29 no puede consumirlos; Vitest es ESM-nativo y consistente con Vite, ya presente en la web). El postinstall de `esbuild` (dependencia de `tsx`) está autorizado en `pnpm-workspace.yaml` (`allowBuilds`); TypeScript queda fijado en la línea 6.x (la 7 eliminó `moduleResolution: node10`, y los tsconfigs ya usan `nodenext`).

## 4. Definition of Done (por rebanada)

Una rebanada se cierra solo cuando:

1. Cumple sus RF/CU/HU del ERS con criterios de aceptación verificados.
2. Tiene pruebas: unitarias (dominio) e integración (API + datos); E2E Playwright si toca un flujo crítico.
3. `lint`, `typecheck` y pruebas en verde (regla del proyecto).
4. Accesibilidad: el flujo cumple el design system (`docs/03-ux/02-design-system.md`) y WCAG AA.
5. Revisión: `lawliet` (código) y, en lo sensible, `levi` (seguridad) — hallazgos críticos resueltos.
6. Evidencia: captura(s), pruebas ejecutadas y nota en la bitácora de la rebanada (para SENA/SENNOVA).
7. Trazabilidad actualizada: RF ↔ CU ↔ HU ↔ prueba ↔ evidencia.

## 5. Gates técnicos

| Gate | Herramienta | Cuándo |
|---|---|---|
| Lint | ESLint (web/api), Ruff (ai) | Cada push (local y CI) |
| Tipos | `tsc --noEmit` / mypy ligero | Cada push |
| Pruebas unitarias | Vitest (web), Jest (api), pytest (ai) | Cada push |
| Integración API + datos | Jest + PostgreSQL efímero | Cada rebanada |
| E2E crítico | Playwright (ya instalado en el entorno) | Flujos A/B/C de la Fase 3 |
| Seguridad | `levi` + checklist OWASP del threat model | Antes del piloto |
| Revisión de código | `lawliet` | Antes de cerrar cada rebanada |

## 6. Entornos

1. **Local:** pnpm + PostgreSQL y Redis en Docker (`infra/`), datos sintéticos siempre.
2. **Staging (free-tier):** despliegue temprano desde la rebanada 1 (ADR-0007) para validar cold starts y límites antes del piloto.
3. **Piloto:** 1–2 fichas + personal de bienestar; activa con el cierre de la rebanada 9.

## 7. Riesgos de la fase

| Riesgo | Mitigación |
|---|---|
| Alcance amplio (SPEC §9) | Rebanadas verticales + timeboxing + revisión de alcance con el cliente interno |
| Dependencias del discovery (reglas de cupos, formatos actuales) | Las rebanadas 1–2 no dependen; M1 cierra sus "por confirmar" con la Fase 0 antes de operar el piloto |
| Trámite WhatsApp (Meta) sin cerrar | El hub nace con adaptador de correo/push; WhatsApp se enciende cuando el trámite cierre (ADR-0001) |
| Equipo de una persona | Solicitud de 1–2 semilleristas (brief SENNOVA); prioridad por rebanadas |

## 8. Evidencias para SENA / SENNOVA

Por rebanada: pruebas ejecutadas (salida real), capturas de la funcionalidad, nota de bitácora con fechas, y actualización de la matriz de trazabilidad. El conjunto alimenta el informe final y los productos comprometidos (protocolo §6).

## Registro de cambios

| Versión | Fecha | Cambio |
|---|---|---|
| 0.1 | 2026-10-13 | Apertura de la Fase 4 (rebanada 0 en curso) |
