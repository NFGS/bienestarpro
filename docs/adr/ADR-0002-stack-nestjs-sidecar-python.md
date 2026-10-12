# ADR-0002: Stack del core — NestJS (adaptador Fastify) + sidecar Python

- **Estado:** Aceptada
- **Fecha:** 2026-10-09
- **Decisores:** Nelson Fabián Gallego Sánchez (semillerista / desarrollador principal), dirección técnica del proyecto
- **Relacionados:** SPEC §4; ADR-0003; ADR-0004; ADR-0009 (RAG del producto, Fase 5)

## Contexto y problema

BienestarPro necesita una API modular por dominios (9 módulos del piloto), mantenible por un equipo semillero pequeño, con PWA en TypeScript que comparta contratos con el backend. A la vez, los frentes de datos e IA (ETL de importaciones, generación de informes, RAG de la Fase 5) viven mucho mejor en el ecosistema Python. El equipo tiene experiencia en NestJS y Python; el hardware y el presupuesto son limitados y cada runtime adicional cuesta operación.

## Alternativas consideradas

1. **Opción A (elegida):** Core NestJS con adaptador Fastify + sidecar Python (FastAPI) para datos e IA.
   - Pros: modularidad probada (módulos, inyección de dependencias, guards), contratos TypeScript compartidos con la PWA, Python donde su ecosistema es superior (pandas, LlamaIndex, etc.).
   - Contras: dos runtimes que desplegar y observar; comunicación interna adicional; CI con dos toolchains.
2. **Opción B:** Todo en Node.js (incluida la IA).
   - Pros: un solo runtime y un solo despliegue.
   - Contras: el ecosistema de datos/ML en JS es inferior; replicar ETL y RAG costaría calidad y tiempo; se forzaría la herramienta al problema.
3. **Opción C:** Todo en Python (FastAPI como core).
   - Pros: un solo lenguaje de backend.
   - Contras: se pierde la estructura modular madura de NestJS y el tipado compartido con la PWA; el equipo quedaría con dos bases de patrones distintos.
4. **Opción D:** Microservicios desde el día 1.
   - Pros: escalabilidad teórica.
   - Contras: sobreingeniería evidente para un equipo semillero; la regla del proyecto es monolito modular primero.

## Decisión

Usaremos **NestJS con adaptador Fastify** como core (monolito modular por dominios) y un **sidecar Python (FastAPI)** para ETL, informes e IA. La comunicación interna es HTTP/JSON con contratos versionados en `packages/contracts`; el sidecar no expone endpoints públicos: todo pasa por el core. El sidecar no accede a la base de datos del core salvo por vistas de lectura explícitamente definidas en una fase posterior.

## Consecuencias

- **Positivas:** arquitectura modular alineada con los bounded contexts del ERS; tipos compartidos de punta a punta en el core; cada tecnología en su terreno fuerte; el sidecar puede desplegarse y escalarse por separado.
- **Negativas / trade-offs:** dos runtimes que operar en una sola máquina (piloto) y en el VPS futuro; superficie de fallo adicional (core disponible pero sidecar caído, y viceversa); CI y despliegue con dos toolchains; requiere disciplina de contratos para no acoplar los servicios.
- **Neutrales:** la curva de aprendizaje para nuevos semilleristas incluye ahora dos frameworks.

## Cumplimiento / verificación

- La estructura del repositorio (`apps/`, `packages/contracts`) refleja la separación, y AGENTS.md obliga a actualizar los contratos antes de romper la API pública.
- Gates separados de lint, typecheck y pruebas por aplicación.
- En Fase 4, prueba de integración que verifique que el sidecar no tiene puertos públicos.

## Enlaces

- `SPEC.md` §4 (arquitectura de alto nivel)
- `docs/01-requisitos/01-ers-borrador-v0.1.md` (RNF-11 observabilidad)
