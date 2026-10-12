# ADR-0007: Topología free-tier del piloto y criterio de migración a VPS

- **Estado:** Aceptada
- **Fecha:** 2026-10-09
- **Decisores:** Nelson Fabián Gallego Sánchez (semillerista / desarrollador principal), dirección técnica del proyecto
- **Relacionados:** SPEC §4 y §9; ADR-0003; ADR-0004; RNF-05; RNF-06

## Contexto y problema

El piloto no tiene presupuesto de infraestructura. La estrategia acordada es salir con capas gratuitas de servicios gestionados y documentar una ruta de migración a VPS cuando el crecimiento o los requisitos institucionales lo exijan. A la vez, la RNF-06 establece que los datos personales no deben salir de una infraestructura controlada sin base jurídica: usar proveedores extranjeros para el piloto introduce tensión con esa meta y debe quedar explícita en la decisión.

## Alternativas consideradas

1. **Opción A (elegida):** Capas gratuitas gestionadas (PostgreSQL, Redis, hosting de API y PWA) con criterios objetivos de migración a VPS.
   - Pros: costo $0; servicios gestionados (respaldos básicos, TLS, menos sysadmin); velocidad de arranque; la migración queda planificada, no improvisada.
   - Contras: cold starts, límites de conexiones/almacenamiento, dependencia de términos de terceros; datos personales en infraestructura de proveedores extranjeros (tensión con RNF-06, mitigable con minimización, selección de región y evaluación de ética).
2. **Opción B:** VPS desde el inicio.
   - Pros: control total y residencia de datos definible; sin cold starts.
   - Contras: costo mensual real (aunque menor), tiempo de sysadmin (seguridad, actualizaciones, respaldos) que el semillero no tiene sobrando.
3. **Opción C:** Todo serverless.
   - Pros: escala automática.
   - Contras: cold starts, límites por invocación, acoplamiento al proveedor; peor encaje con colas y workers persistentes (ADR-0004).
4. **Opción D:** Infraestructura on-premise del centro.
   - Pros: residencia de datos en el SENA.
   - Contras: trámites institucionales, capacidades inciertas; no viable para arrancar el piloto.

## Decisión

Usaremos **capas gratuitas gestionadas** para el piloto, con estas reglas:

- **D1 —** Servicios de referencia: PostgreSQL gestionado, Redis gestionado, hosting de la API y de la PWA en capas gratuitas (los proveedores concretos se fijan en la implementación del piloto; SPEC §4 cita Neon, Upstash, Render y Vercel como referencia).
- **D2 —** Secretos fuera del repositorio; configuración por variables de entorno; `.env.example` versionado.
- **D3 —** Región de los servicios elegida priorizando la cercanía y las opciones regionales disponibles que reduzcan la exposición de datos personales; el tratamiento con datos reales del piloto se evalúa con el marco de ética SENNOVA antes de salir a producción.
- **D4 —** **Criterios de migración a VPS** (se dispara migración cuando ocurra cualquiera): (a) límites de conexiones o almacenamiento que afecten la operación; (b) cold starts que violen RNF-05 en horario operativo; (c) costo proyectado superior al de un VPS equivalente; (d) requisito institucional de residencia de datos en infraestructura propia o del SENA.
- **D5 —** La migración se documentará en su propio ADR cuando se dispare un criterio.

## Consecuencias

- **Positivas:** arranque a costo $0; menos operación (gestionado); la migración futura es una decisión ya pensada.
- **Negativas / trade-offs:** cold starts y límites en el peor momento posible (jornadas pico); dependencia de los términos de uso de cada proveedor; tensión pendiente con RNF-06 que se resuelve con evaluación ética y, a futuro, con la migración.
- **Neutrales:** la topología real se reflejará en la documentación de infraestructura del repositorio (`infra/`).

## Cumplimiento / verificación

- Medición de latencia y disponibilidad del piloto (RNF-05) contra los criterios (b).
- Revisión periódica de los criterios D4; al dispararse uno, ADR de migración.
- Checklist de ética y datos (consentimiento, minimización) antes de operar con datos reales.

## Enlaces

- `SPEC.md` §4 (despliegue piloto) y §9 (riesgos)
- `docs/01-requisitos/01-ers-borrador-v0.1.md` (RNF-05, RNF-06)
