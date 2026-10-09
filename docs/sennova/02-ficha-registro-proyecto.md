# Ficha de Registro del Proyecto — BienestarPro

**Fecha de registro:** 2026-10-09

**Nota sobre formato:** aún no se cuenta con el formato oficial del grupo SENNOVA. Esta ficha contiene todos los campos estándar de registro y está diseñada para transcribirse directamente al formato vigente cuando llegue (ver sección de mapeo al final).

**Documento relacionado:** `docs/sennova/01-protocolo-investigacion.md` (protocolo completo del cual esta ficha es el resumen).

---

## 1. Identificación del proyecto

| Campo | Valor |
|---|---|
| Título | BienestarPro: sistema de gestión integral de bienestar al aprendiz con notificaciones multicanal — caso Centro de Comercio y Turismo (SENA, Armenia) |
| Grupo de investigación | `[por confirmar]` |
| Línea de investigación | `[por confirmar]` |
| Modalidad | Proyecto de investigación aplicada (semillero) |
| Investigador principal | `[por confirmar]` |
| Semillerista | Nelson Fabián Gallego Sánchez |
| Programa académico del semillerista | Tecnólogo en Análisis y Desarrollo de Software (ADSO) — SENA |
| Centro / regional | Centro de Comercio y Turismo — SENA Regional Quindío (Armenia) |
| Duración | `[por confirmar con el grupo]` (estimado: 6 meses) |
| Fecha de inicio | `[por confirmar]` |
| Estado del registro | Propuesto — pendiente de validación por el grupo SENNOVA |

---

## 2. Resumen

El proyecto desarrolla y valida una plataforma web progresiva (PWA) que automatiza la asignación y entrega de refrigerios, las notificaciones multicanal y los servicios de comunicación del área de Bienestar al Aprendiz del Centro de Comercio y Turismo del SENA (Armenia). La investigación sigue la metodología Design Science Research (DSR): se levanta el proceso actual (AS-IS) con métricas de línea base, se diseña e implementa una arquitectura modular multi-tenant, se ejecuta un piloto real con 1 a 2 fichas y se evalúa comparando métricas pre/post y la Escala de Usabilidad del Sistema (SUS). Los resultados esperados incluyen una mejora operativa medible, productos de divulgación y apropiación social, y un modelo replicable a otros centros del SENA con costo de operación sostenible.

---

## 3. Palabras clave

Refrigerios; bienestar al aprendiz; PWA; notificaciones multicanal; usabilidad; Design Science Research; SENA; multi-tenant.

---

## 4. Objetivo general

Desarrollar y validar una plataforma web progresiva (PWA) que automatice la asignación y entrega de refrigerios, las notificaciones multicanal y los servicios de comunicación del área de Bienestar al Aprendiz del Centro de Comercio y Turismo, con potencial de replicación multi-centro.

---

## 5. Objetivos específicos

1. Levantar y modelar el proceso actual (AS-IS) con métricas de línea base antes del piloto (`docs/00-discovery/05-baseline-metricas.md`).
2. Diseñar la arquitectura del sistema (multi-tenant, hub de notificaciones, PWA offline-first) documentada con ADRs.
3. Implementar los módulos del piloto (refrigerios, notificaciones, fichas, contactos de emergencia, noticias y campañas, encuestas, reuniones e informes) con pruebas automatizadas cuando apliquen.
4. Validar el sistema en un piloto real (1–2 fichas), midiendo métricas pre/post (reprocesos, tiempos, desperdicio, consultas repetitivas y satisfacción) y aplicando SUS.
5. Formular el plan de apropiación social y transferencia (capacitaciones, cartilla y manuales).
6. Documentar los productos comprometidos con sus medios de verificación.

---

## 6. Productos comprometidos

| # | Producto | Tipología (Minciencias) | Medio de verificación |
|---|---|---|---|
| 1 | Software BienestarPro (código fuente + despliegue piloto) | Desarrollo tecnológico | Registro ante DNDA (cuando aplique) + evidencias de funcionamiento |
| 2 | Ponencia | Divulgación | Certificado de aceptación + memorias del evento (REDCOLSI u otro evento SENNOVA) |
| 3 | Artículo científico | Divulgación | Publicación aceptada o en proceso, con evidencia |
| 4 | Capacitaciones + cartilla y manuales de usuario | Apropiación social | Listas de asistencia + acta de capacitación + cartilla entregada |
| 5 | Informe final de investigación | Divulgación | Documento aprobado por el grupo |

---

## 7. Cronograma (resumen)

| Fase | Contenido | Meses |
|---|---|---|
| 0. Discovery | AS-IS, línea base, hallazgos | `[por confirmar]` |
| 1. Requisitos | ERS, casos de uso, historias de usuario + protocolo | `[por confirmar]` |
| 2. Arquitectura | ADRs, modelo de datos, threat model | `[por confirmar]` |
| 3. UX | Wireframes, design system, validación | `[por confirmar]` |
| 4. Construcción | Módulos del piloto + pruebas + piloto en terreno | `[por confirmar]` |
| 5. Post-piloto | Registro de portátiles, IA/RAG, evaluación pre/post y SUS | `[por confirmar]` |
| 6. Cierre | Apropiación social, productos SENNOVA, acta de cierre | `[por confirmar]` |

Detalle por mes en el protocolo, sección 8.

---

## 8. Contrapartida y presupuesto

El proyecto se ejecuta en especie: infraestructura con capas gratuitas (PostgreSQL gestionado, Redis gestionado, hosting en capas gratuitas), stack 100% open source, equipos del semillerista y acompañamiento del grupo. El único costo directo estimado es el servicio de mensajería (WhatsApp) con uso mínimo durante el piloto (menos de USD 5 por mes). Detalle en el protocolo, sección 10.

---

## 9. Mapeo al formato del grupo SENNOVA

Cuando llegue el formato oficial del grupo, esta ficha se transcribe así:

| Sección de esta ficha | Campo equivalente del formato del grupo |
|---|---|
| 1. Identificación del proyecto | Datos generales del proyecto (título, grupo, línea, investigadores, duración) |
| 2. Resumen | Resumen ejecutivo |
| 3. Palabras clave | Palabras clave |
| 4. Objetivo general | Objetivo general |
| 5. Objetivos específicos | Objetivos específicos |
| 6. Productos comprometidos | Productos esperados (tipologías Minciencias) |
| 7. Cronograma | Cronograma de actividades |
| 8. Contrapartida y presupuesto | Presupuesto y contrapartidas |
| Firmas | Espacio de autorizaciones del formato |

Todos los campos marcados como `[por confirmar]` se completan con la información oficial del grupo.

---

## Firmas

| Rol | Nombre | Firma | Fecha |
|---|---|---|---|
| Investigador principal | `[por confirmar]` | _________________________ | ____ / ____ / ______ |
| Semillerista | Nelson Fabián Gallego Sánchez | _________________________ | ____ / ____ / ______ |
| Coordinador/a del grupo | `[por confirmar]` | _________________________ | ____ / ____ / ______ |
