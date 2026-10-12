# ADR-0004: Hub de notificaciones (patrón outbox + BullMQ + adaptadores intercambiables)

- **Estado:** Aceptada
- **Fecha:** 2026-10-09
- **Decisores:** Nelson Fabián Gallego Sánchez (semillerista / desarrollador principal), dirección técnica del proyecto
- **Relacionados:** SPEC §6; ADR-0001 (estrategia WhatsApp, pendiente); ADR-0005; ADR-0007; RF-14; RF-22 a RF-27; RNF-09; RNF-10

## Contexto y problema

La regla de oro del sistema es "que la información correcta llegue a la persona correcta en el momento correcto". Eso exige: multicanal (correo, WhatsApp, push), cascada de fallback, acuses de entrega, preferencias y horario silencioso, límites anti-spam y reintentos. Los proveedores de cada canal cambian (el trámite de WhatsApp con Meta está pendiente) y el dominio no debe acoplarse a ninguno. Además, un pico de mensajes no puede tumbar la operación de entrega de refrigerios.

## Alternativas consideradas

1. **Opción A (elegida):** Patrón **outbox transaccional** + colas **BullMQ (Redis)** + **adaptadores** por canal.
   - Pros: el envío no bloquea la transacción de negocio; reintentos y backoff estándar; cambiar de proveedor es escribir un adaptador; acuses y estados trazables; rate-limit y horario silencioso centralizados.
   - Contras: hay que operar Redis; el estado de una notificación es asíncrono (puede estar "en cola"); más superficie de pruebas (idempotencia, reintentos, cascada).
2. **Opción B:** Envío sincrónico desde la API.
   - Pros: simplicidad inmediata.
   - Contras: acopla la latencia y los fallos del proveedor al request del usuario; sin reintentos; un pico degrada la operación completa.
3. **Opción C:** Servicio SaaS todo-en-uno de notificaciones.
   - Pros: menos infraestructura propia.
   - Contras: costo por volumen, un tercero más con datos de aprendices (Ley 1581), y WhatsApp seguiría necesitando la ruta oficial; dependencia estratégica.
4. **Opción D:** Escribir a cada proveedor directamente desde cada caso de uso.
   - Pros: cero infraestructura.
   - Contras: lógica duplicada, sin cascada ni acuses centralizados; imposible de mantener.

## Decisión

Usaremos un **hub de notificaciones** con estas reglas:

- **D1 — Outbox:** cada evento que dispara una notificación escribe en una tabla outbox dentro de la misma transacción del caso de uso (nada se pierde si el worker cae).
- **D2 — Colas:** un worker publica a colas BullMQ (Redis) por canal; reintentos con backoff progresivo; idempotencia por clave de mensaje.
- **D3 — Adaptadores:** interfaz común por canal (enviar, consultar estado, procesar webhooks). Cambiar de proveedor no toca el dominio.
- **D4 — Cascada:** fallback push, luego WhatsApp, luego correo (RN-06), configurable.
- **D5 — Reglas transversales:** preferencias por usuario, horario silencioso (RN-05), rate-limit anti-spam y registro `sent/delivered/read/failed` se aplican en el hub, no en cada módulo.
- **D6 — Plantillas:** versionadas; cada envío registra la versión usada.

## Consecuencias

- **Positivas:** resiliencia y trazabilidad completas (RNF-10); la convocatoria, los recordatorios y las campañas reutilizan el mismo hub (CU-11, CU-22, CU-25, CU-30, CU-32); desacople real de proveedores.
- **Negativas / trade-offs:** Redis entra a la operación (costo cero en piloto con capa gratuita, pero un componente más); complejidad de pruebas (fallos simulados, cascada, duplicados); la entrega ya no es instantánea por diseño.
- **Neutrales:** el estado "en cola" es visible para el usuario en los acuses (CU-21).

## Cumplimiento / verificación

- Prueba de cascada: se simula la caída del canal primario y el mensaje sale por el siguiente, registrando cada intento.
- Prueba de idempotencia: reencolar el mismo mensaje no genera envíos duplicados.
- Los criterios de RNF-09 y RNF-10 se verifican sobre el registro de notificaciones.

## Enlaces

- `SPEC.md` §6 (notificaciones)
- `docs/01-requisitos/01-ers-borrador-v0.1.md` (RF-22 a RF-27)
