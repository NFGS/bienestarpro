# BienestarPro

[![CI](https://github.com/NFGS/bienestarpro/actions/workflows/ci.yml/badge.svg)](https://github.com/NFGS/bienestarpro/actions/workflows/ci.yml)

> Sistema de gestión integral para el área de Bienestar al Aprendiz — Centro de Comercio y Turismo, SENA Regional Quindío (Armenia).

BienestarPro es una plataforma web multi-plataforma (PWA) que automatiza la asignación y entrega de refrigerios, las notificaciones multicanal (correo, WhatsApp y push), el control de ingreso de portátiles y los servicios de comunicación institucional (noticias, encuestas, reuniones, directorio de fichas y contactos de emergencia).

**Doble naturaleza del proyecto:**

- Proyecto formativo del Tecnólogo en Análisis y Desarrollo de Software (ADSO) — SENA.
- Proyecto de I+D+i en curso del grupo de investigación SENNOVA del centro (rol: semillerista).

## Estado

| Fase | Estado |
|---|---|
| 0 — Discovery | En curso — instrumentos listos; sesiones de campo pendientes |
| 1 — Requisitos | Borrador v0.1 (ERS, casos de uso, historias, diagrama) |
| 2 — Arquitectura | Borrador v0.1 (ADRs, modelo de datos, threat model, referencia) |
| 3 — UX | En curso (revisión de muestras + design system v0.1) |
| 4 — Construcción + piloto | En curso (rebanada 4: M2 Notificaciones backend; siguiente: rebanada 5) |
| 5 — Post-piloto (portátiles, IA) | Pendiente |
| 6 — Cierre y productos SENNOVA | Pendiente |

## Documentación clave

| Documento | Ubicación |
|---|---|
| Especificación del sistema | [`SPEC.md`](./SPEC.md) |
| Reglas para agentes y desarrolladores | [`AGENTS.md`](./AGENTS.md) |
| Decisiones de arquitectura (ADRs) | [`docs/adr/`](./docs/adr/) |
| Discovery (Fase 0) | [`docs/00-discovery/`](./docs/00-discovery/) |
| Requisitos (Fase 1) | [`docs/01-requisitos/`](./docs/01-requisitos/) |
| Arquitectura (Fase 2) | [`docs/02-arquitectura/`](./docs/02-arquitectura/) |
| UX (Fase 3) | [`docs/03-ux/`](./docs/03-ux/) |
| Construcción (Fase 4) | [`docs/04-construccion/`](./docs/04-construccion/) |
| Investigación SENNOVA | [`docs/sennova/`](./docs/sennova/) |

## Estructura del repositorio

```
BienestarPro/
├── apps/
│   ├── web/          # PWA (React 19 + Vite + Workbox)
│   ├── api/          # Backend modular (NestJS)
│   └── ai/           # Sidecar Python (FastAPI): ETL, informes, IA/RAG
├── packages/
│   ├── contracts/    # Contratos compartidos (OpenAPI/Zod)
│   └── ui/           # Design system
├── infra/            # Docker Compose, Caddy, scripts de despliegue
├── docs/             # Documentación del proyecto
│   ├── 00-discovery/
│   ├── 01-requisitos/
│   ├── 02-arquitectura/
│   ├── 03-ux/
│   ├── 04-construccion/
│   ├── adr/
│   └── sennova/
├── SPEC.md
├── AGENTS.md
└── README.md
```

## Stack (resumen)

| Capa | Tecnología |
|---|---|
| PWA | React 19 + TypeScript + Vite + Workbox |
| API | NestJS (Node LTS) — monolito modular |
| IA/automatización | Python (FastAPI) + BullMQ (colas) |
| Base de datos | PostgreSQL (con RLS multi-centro) |
| Notificaciones | Hub propio: correo + WhatsApp + push web |
| Despliegue piloto | Capas gratuitas (Neon, Upstash, Render, Vercel) |

Detalle completo y decisiones en [`SPEC.md`](./SPEC.md) y [`docs/adr/`](./docs/adr/).

## Convenciones

- Conventional Commits; ramas cortas; cambios pequeños y revisables.
- Documentación en español; código y nombres técnicos en inglés.
- Sin secretos en el repositorio. Datos personales bajo la Ley 1581 de 2012.
- Licencia y titularidad: en definición con UPI/SAPI del SENA (ver ADR-0010 en [`docs/adr/`](./docs/adr/README.md)).

## Próximos pasos

1. Ejecutar las sesiones de campo del discovery (instrumentos y guiones listos en `docs/00-discovery/`).
2. Validar el prototipo con usuarios (guion e instrumento en `docs/03-ux/`).
3. Continuar la Fase 4: rebanada 0 (esqueletos de API/IA, contratos y CI) y después la rebanada 1 (M4 Administración).
