# Índice de ADRs — BienestarPro

**Architecture Decision Records (ADRs)** en formato [MADR](https://adr.github.io/madr/). Cada decisión arquitectónica relevante se documenta aquí, con contexto, alternativas y consecuencias.

- Plantilla: [`ADR-0000-plantilla.md`](./ADR-0000-plantilla.md)
- Numeración consecutiva; nunca se renumera ni se borra un ADR (se marca como reemplazado).

## Estado de las decisiones

| ADR | Título | Estado |
|---|---|---|
| ADR-0001 | Estrategia de WhatsApp (Cloud API oficial vs alternativas) | Pendiente (Fase 2; insumos en checklist Meta) |
| ADR-0002 | Stack del core: NestJS + sidecar Python | Decisión tomada — redactada (borrador v0.1) |
| ADR-0003 | PostgreSQL + RLS multi-tenant por centro | Decisión tomada — redactada (borrador v0.1) |
| ADR-0004 | Hub de notificaciones (outbox + BullMQ + adaptadores) | Decisión tomada — redactada (borrador v0.1) |
| ADR-0005 | Automatización 100% en código (sin n8n, fair-code) | Decisión tomada — redactada (borrador v0.1) |
| ADR-0006 | Identidad propia con puerto de federación (Google/Microsoft/Keycloak) | Decisión tomada — redactada (borrador v0.1) |
| ADR-0007 | Topología free-tier del piloto y criterio de migración a VPS | Decisión tomada — redactada (borrador v0.1) |
| ADR-0008 | PWA offline-first y modo kiosco (portería y entrega) | Decisión tomada — redactada (borrador v0.1) |
| ADR-0009 | IA local y RAG (Ollama + LlamaIndex + pgvector) | Pendiente (Fase 2/Fase 5) |
| ADR-0010 | Licencia y titularidad de propiedad intelectual (SENNOVA/UPI) | Bloqueada por Guía PI SENNOVA |
| ADR-0011 | Datos sensibles: contactos de emergencia y anonimato en encuestas | Decisión tomada — redactada (borrador v0.1) |
| ADR-0012 | Integración de calendarios (Google Calendar / Microsoft Graph) | Diferida (Fase 5) |
| ADR-0013 | Alcance del piloto: módulos completos y orden de construcción | Decisión tomada — redactada (borrador v0.1) |
| ADR-0014 | Motor de investigación RAG local (Open Notebook) y política de conservación de archivos | Decisión tomada — redactada |
| ADR-0015 | Actualizar Open Notebook de la imagen local parcheada v1.10.0 a la imagen oficial v1.15.0 pineada | Decisión tomada — redactada |
| ADR-0016 | ORM y migraciones: Drizzle ORM con SQL versionado | Decisión tomada — redactada (borrador v0.1) |

## Bitácora resumida (contexto de las decisiones)

| Fecha | Decisión | Contexto |
|---|---|---|
| 2026-10-08 | PWA multiplataforma con React + Vite | Requisito: computadores y celulares, usuarios de baja alfabetización digital |
| 2026-10-08 | Solo código para automatización (n8n descartado) | Estándar "100% open source" estricto: n8n es fair-code (no OSI) |
| 2026-10-08 | Correo + push + WhatsApp desde el MVP | Decisiones del cliente interno |
| 2026-10-08 | Piloto en capas gratuitas | Restricción de costo; migración a VPS documentada |
| 2026-10-08 | Módulos completos desde el piloto | Decisión del cliente interno con mitigaciones (equipo + rebanadas verticales) |
| 2026-10-08 | Embeddings locales (qwen3-embedding:0.6b); chat en nube | Hardware limitado (15 GB RAM, GPU AMD) |
| 2026-10-09 | Motor de investigación: Open Notebook en Docker; embeddings locales, chat en Google AI | Corpus con licencia se mantiene local; gateway anterior incompatible (`MissingSessionID`) |
| 2026-10-12 | Open Notebook actualizado a imagen oficial v1.15.0 pineada (se depreca la imagen parcheada local) | 5 versiones de retraso; el parche Kimi quedó cubierto nativamente por `anthropic_compatible` |
| 2026-10-13 | ORM del proyecto: Drizzle + drizzle-kit + postgres.js | Control del SQL para las políticas RLS (ADR-0003); sin binarios de motor en capas gratuitas |
