# BienestarPro

> Sistema de gestión integral para el área de Bienestar al Aprendiz — Centro de Comercio y Turismo, SENA Regional Quindío (Armenia).

BienestarPro es una plataforma web multi-plataforma (PWA) que automatiza la asignación y entrega de refrigerios, las notificaciones multicanal (correo, WhatsApp y push), el control de ingreso de portátiles y los servicios de comunicación institucional (noticias, encuestas, reuniones, directorio de fichas y contactos de emergencia).

**Doble naturaleza del proyecto:**

- Proyecto formativo del Tecnólogo en Análisis y Desarrollo de Software (ADSO) — SENA.
- Proyecto de I+D+i en curso del grupo de investigación SENNOVA del centro (rol: semillerista).

## Estado

| Fase | Estado |
|---|---|
| 0 — Discovery | En curso |
| 1 — Requisitos | Pendiente |
| 2 — Arquitectura | Pendiente |
| 3 — UX | Pendiente |
| 4 — Construcción + piloto | Pendiente |
| 5 — Post-piloto (portátiles, IA) | Pendiente |
| 6 — Cierre y productos SENNOVA | Pendiente |

## Documentación clave

| Documento | Ubicación |
|---|---|
| Especificación del sistema | [`SPEC.md`](./SPEC.md) |
| Reglas para agentes y desarrolladores | [`AGENTS.md`](./AGENTS.md) |
| Decisiones de arquitectura (ADRs) | [`docs/adr/`](./docs/adr/) |
| Discovery (Fase 0) | [`docs/00-discovery/`](./docs/00-discovery/) |
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

## Próximos pasos (Fase 0)

1. Ejecutar entrevistas y observación (guion en `docs/00-discovery/01-guion-entrevistas.md`).
2. Completar inventario documental y métricas de línea base.
3. Cerrar el checklist SENNOVA y el checklist Meta/WhatsApp.
