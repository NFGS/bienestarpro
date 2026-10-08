# AGENTS.md — BienestarPro

Reglas para agentes de IA y desarrolladores que trabajen en este repositorio. Complementa las reglas globales del entorno del autor.

## Contexto

- Cliente: área de Bienestar al Aprendiz, Centro de Comercio y Turismo (SENA, Armenia, Quindío).
- Doble marco: proyecto formativo ADSO + proyecto de I+D+i SENNOVA (semillero).
- Usuarios con baja alfabetización digital: la simplicidad de la interfaz es un requisito, no un lujo.

## Idioma

- Documentación, UI y mensajes al usuario: español.
- Código (variables, funciones), ramas y commits: inglés; Conventional Commits.

## Stack (decidido)

| Capa | Tecnología |
|---|---|
| Frontend | React 19 + TypeScript + Vite + PWA (vite-plugin-pwa + Workbox) |
| Backend | NestJS (Node LTS, adaptador Fastify) modular por dominios |
| IA/datos | Sidecar Python (FastAPI): ETL, informes, RAG |
| Base de datos | PostgreSQL (RLS multi-tenant por centro) |
| Caché/colas | Redis + BullMQ |
| Automatización | 100% en código (sin n8n) |
| Despliegue piloto | Capas gratuitas; migración a VPS documentada en ADR |

## Estándares no negociables

- Clean Architecture + DDD ligero por bounded contexts; monolito modular primero.
- OWASP Top 10; Ley 1581 de 2012 (protección de datos de aprendices y visitantes).
- Pruebas unitarias, de integración y E2E cuando apliquen; lint + typecheck antes de terminar.
- Cambios pequeños; cada decisión relevante se documenta en `docs/adr/` (formato MADR).
- Trazabilidad: requisito ↔ caso de uso ↔ historia ↔ prueba ↔ evidencia.
- SENNOVA: todo producto de investigación debe tener medio de verificación.

## Estructura de documentación

- `docs/00-discovery/` — levantamiento, AS-IS, métricas, checklists.
- `docs/01-requisitos/` — ERS, casos de uso, historias de usuario.
- `docs/02-arquitectura/` — diagramas, modelo de datos, threat model.
- `docs/03-ux/` — wireframes, design system, evidencias de validación.
- `docs/adr/` — decisiones de arquitectura (MADR).
- `docs/sennova/` — protocolo de investigación y productos.

## Reglas de oro

1. Nunca commitear secretos ni datos personales reales; usar datos sintéticos en desarrollo.
2. No romper la superficie pública de la API sin actualizar `packages/contracts`.
3. Toda notificación saliente respeta preferencias de usuario, horario silencioso y rate-limits.
4. WhatsApp y correo se consumen siempre detrás de adaptadores (el proveedor se decide en ADR).
5. Antes de declarar una tarea terminada: `lint`, `typecheck` y pruebas en verde.
