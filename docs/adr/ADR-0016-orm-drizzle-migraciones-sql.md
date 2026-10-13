# ADR-0016: ORM y migraciones — Drizzle ORM con SQL versionado

- **Estado:** Aceptada
- **Fecha:** 2026-10-13
- **Decisores:** Nelson Fabián Gallego Sánchez (semillerista / desarrollador principal), dirección técnica del proyecto
- **Relacionados:** ADR-0003 (PostgreSQL + RLS); ADR-0002 (stack NestJS); RNF-07; plan de construcción (rebanada 1)

## Contexto y problema

La API necesita acceso tipado a PostgreSQL con migraciones versionadas. La decisión está condicionada por tres fuerzas reales del proyecto:

1. **RLS es central (ADR-0003):** las políticas de Row-Level Security y el contexto por transacción (`SET LOCAL app.centro_id`) requieren control fino del SQL generado y de las migraciones.
2. **Recursos limitados:** el piloto corre en capas gratuitas y en una máquina de desarrollo modesta; los motores/binarios adicionales cuestan memoria y despliegue.
3. **Equipo de una persona:** la herramienta debe ser productiva sin sacrificar transparencia del SQL (defendible ante auditoría y ante jurado).

## Alternativas consideradas

1. **Opción A (elegida): Drizzle ORM + drizzle-kit + postgres.js.**
   - Pros: TypeScript nativo sin binarios de motor; las migraciones son **SQL legible y editable** (indispensable para añadir políticas RLS a mano); consultas cercanas al SQL (fácil auditar el aislamiento); runtime liviano (postgres.js); tipado derivado del esquema.
   - Contras: ecosistema más joven que Prisma; menos herramientas visuales; algunas operaciones avanzadas se escriben como SQL (aceptable aquí, es justamente lo que queremos controlar).
2. **Opción B: Prisma.**
   - Pros: excelente DX (Prisma Studio, migraciones, cliente tipado muy maduro).
   - Contras: motor/binario adicional en runtime y despliegue (peso y memoria en capas gratuitas); las políticas RLS quedan fuera del esquema y requieren SQL crudo en migraciones igualmente; el SQL generado es menos transparente.
3. **Opción C: TypeORM.**
   - Pros: integración clásica con NestJS.
   - Contras: tipado más débil; patrón de repositorio pesado; historial de migraciones frágil; menos control del SQL.
4. **Opción D: SQL puro con `pg` y migraciones a mano.**
   - Pros: control total.
   - Contras: sin tipado del esquema (el mayor costo de mantenimiento para un equipo de una persona); más trabajo repetitivo.

## Decisión

Usaremos **Drizzle ORM** con `drizzle-kit` para generar migraciones y **postgres.js** como driver:

- **D1 —** Esquema en `apps/api/src/db/schema.ts`; migraciones SQL versionadas en `apps/api/drizzle/`.
- **D2 —** Las políticas RLS y el contexto de sesión (`SET LOCAL app.centro_id`) se implementan en migraciones SQL explícitas y en transacciones de la capa de datos (cuando lleguen las tablas multi-tenant de M9/M1).
- **D3 —** La conexión se configura por `DATABASE_URL` (`.env` local no versionado; `.env.example` versionado; variables de entorno en CI y despliegue).
- **D4 —** Los datos de desarrollo/pruebas son sintéticos (Ley 1581).

## Consecuencias

- **Positivas:** migraciones auditables (cada política RLS queda en el historial de git); sin binarios de motor en el despliegue; SQL transparente para las pruebas de aislamiento de RNF-07; runtime liviano.
- **Negativas / trade-offs:** ecosistema más pequeño (menos respuestas en foros); operaciones complejas se escriben en SQL; el equipo debe mantener disciplina de migraciones (nunca editar una migración ya aplicada).
- **Neutrales:** las herramientas visuales de administración quedan fuera del flujo principal (se puede usar cualquier cliente SQL contra la base local).

## Cumplimiento / verificación

- `drizzle-kit generate` produce migraciones SQL que se revisan antes de aplicarse; `drizzle-kit migrate` las aplica en local y CI.
- La primera migración (`users`, `centers`) queda en el historial; las políticas RLS se añadirán como migraciones explícitas en las rebanadas de M9/M1 con sus pruebas de aislamiento.

## Enlaces

- `docs/02-arquitectura/01-modelo-datos.md` (modelo de datos)
- `docs/04-construccion/00-plan-construccion.md` (rebanada 1)
