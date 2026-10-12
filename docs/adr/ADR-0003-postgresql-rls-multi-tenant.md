# ADR-0003: PostgreSQL con Row-Level Security (multi-tenant por centro)

- **Estado:** Aceptada
- **Fecha:** 2026-10-09
- **Decisores:** Nelson Fabián Gallego Sánchez (semillerista / desarrollador principal), dirección técnica del proyecto
- **Relacionados:** SPEC §4 y §5; ADR-0007; RNF-03; RNF-07; RF-03

## Contexto y problema

El sistema nace con aspiraciones nacionales: el Centro de Comercio y Turismo es el primer centro (tenant), pero la plataforma debe replicarse a otros centros del SENA sin fugas de datos entre ellos. El aislamiento es también una obligación de la Ley 1581 de 2012. El equipo es pequeño y el piloto corre en capas gratuitas, así que las alternativas que multiplican la operación (una base o un esquema por centro) son especialmente costosas aquí.

## Alternativas consideradas

1. **Opción A (elegida):** Una base PostgreSQL con columna `centro_id` en cada tabla multi-tenant y **Row-Level Security (RLS)** activo.
   - Pros: una sola migración y una sola base que operar; el aislamiento se aplica en el motor (defensa en profundidad: aunque una consulta de la aplicación olvide filtrar, la política bloquea); pruebas automatizadas de aislamiento posibles.
   - Contras: las políticas RLS agregan complejidad (hay que definir contexto de sesión correctamente); el rendimiento exige índices que comiencen por `centro_id`; un error en el contexto puede romper consultas legítimas.
2. **Opción B:** Un esquema PostgreSQL por centro.
   - Pros: aislamiento fuerte por esquema.
   - Contras: cada migración se multiplica por réplica; operación y despliegue pesados para un semillero.
3. **Opción C:** Una base de datos por centro.
   - Pros: aislamiento máximo.
   - Contras: costo y operación inviables en las capas gratuitas del piloto; complica la administración central.
4. **Opción D:** Filtrar solo en la capa de aplicación.
   - Pros: simplicidad inicial.
   - Contras: un solo bug o una consulta directa expone datos de otro centro; sin defensa en profundidad; no defendible ante una auditoría.

## Decisión

Usaremos **PostgreSQL como fuente única de verdad**, con `centro_id` en cada tabla multi-tenant y **RLS activo por defecto**. La aplicación establece el centro activo de la sesión en cada transacción (contexto explícito); el Superadmin opera con una política dedicada y auditada. Toda tabla nueva debe nacer con `centro_id` (cuando aplique) y su política RLS. La extensión `pgvector` queda reservada para la Fase 5 (ADR-0009).

## Consecuencias

- **Positivas:** aislamiento verificado en el motor y en pruebas; una sola migración por cambio; camino natural hacia informes multi-centro con rol privilegiado; alineado con la RNF-07 (cero fugas entre centros).
- **Negativas / trade-offs:** complejidad de políticas y de contexto de sesión; rendimiento a vigilar (índices por `centro_id`, planes de consulta); riesgo de "olvidar" el contexto en una consulta nueva, mitigado con pruebas que fallan si falta.
- **Neutrales:** los respaldos y la administración de la base siguen siendo únicos (más simples, pero concentran riesgo operativo).

## Cumplimiento / verificación

- Pruebas automatizadas de aislamiento: desde el contexto del centro A, todo intento de leer o escribir datos del centro B devuelve cero filas o error.
- Revisión de cada migración: toda tabla multi-tenant incluye `centro_id` y política.
- El modelo de datos (`docs/02-arquitectura/01-modelo-datos.md`) documenta las políticas aplicadas.

## Enlaces

- `SPEC.md` §4 (multi-tenant desde el día 1) y §5 (Ley 1581)
- `docs/01-requisitos/01-ers-borrador-v0.1.md` (RNF-07)
