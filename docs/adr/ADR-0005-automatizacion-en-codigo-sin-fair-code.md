# ADR-0005: Automatización 100% en código (sin n8n ni herramientas fair-code)

- **Estado:** Aceptada
- **Fecha:** 2026-10-09
- **Decisores:** Nelson Fabián Gallego Sánchez (semillerista / desarrollador principal), dirección técnica del proyecto
- **Relacionados:** ADR-0004; RNF-11; reglas del proyecto (AGENTS.md)

## Contexto y problema

El proyecto necesita automatizaciones variadas: recordatorios programados, cierres de evento, consolidados para cafetería, informes periódicos y, más adelante, ETL de importaciones. La opción popular para esto es n8n (automatización visual), pero su licencia es "fair-code" (Sustainable Use License), que no cumple el estándar del proyecto de ser 100% open source en el sentido OSI. Además, cada herramienta extra es un runtime más que operar, y la lógica en una interfaz visual es difícil de versionar, revisar y probar con el rigor que exige el doble marco (ADSO + SENNOVA).

## Alternativas consideradas

1. **Opción A (elegida):** Automatización en código versionado: jobs programados del framework (NestJS scheduler), colas BullMQ (ADR-0004), scripts del sidecar Python para ETL e informes.
   - Pros: todo queda en git, con revisión, pruebas y observabilidad; cero costo y cero dependencias de licencia; el equipo ya conoce el stack.
   - Contras: más código propio que mantener; algunas automatizaciones sencillas toman más tiempo que arrastrar un nodo en una interfaz visual.
2. **Opción B:** n8n.
   - Pros: rápido para flujos simples; mucha integración lista.
   - Contras: licencia fair-code (no OSI); runtime adicional en una máquina única; la lógica no vive en el repositorio con pruebas; riesgo de convertirse en dependencia crítica no auditada.
3. **Opción C:** Zapier / Make (SaaS).
   - Pros: cero infraestructura.
   - Contras: costo mensual, datos de aprendices hacia terceros (Ley 1581), límites de tareas, dependencia externa total.

## Decisión

Toda automatización se implementa **en código** dentro del repositorio:

- **D1 —** Jobs programados con el scheduler del core; tareas pesadas o de datos, en el sidecar Python; mensajería asíncrona vía BullMQ (ADR-0004).
- **D2 —** Jobs idempotentes, con reintentos y backoff, logging estructurado y métricas (RNF-11).
- **D3 —** Prohibido introducir dependencias fair-code o de licencia no OSI. Antes de agregar una herramienta se verifica su licencia y, si es dudosa, se documenta en un ADR.
- **D4 —** Un job nuevo nace con su prueba automatizada y su entrada en la documentación de operación.

## Consecuencias

- **Positivas:** control y auditabilidad totales; cero costo de licencias; todo el comportamiento es revisable en pull requests; el conocimiento queda en el equipo.
- **Negativas / trade-offs:** más tiempo de desarrollo frente a una herramienta visual; disciplina requerida para no reintroducir atajos por conveniencia.
- **Neutrales:** la revisión de licencias de dependencias se vuelve una práctica recurrente (aún sin automatizar en CI; propuesto como mejora futura).

## Cumplimiento / verificación

- Revisión de dependencias antes de cada fusión (licencia declarada en el PR o ADR).
- Inventario de jobs en la documentación de operación con su prueba asociada.
- Los gates de lint, typecheck y pruebas cubren también los jobs.

## Enlaces

- `AGENTS.md` (estándar 100% open source)
- `docs/01-requisitos/01-ers-borrador-v0.1.md` (RNF-11)
