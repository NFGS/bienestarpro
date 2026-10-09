# Plan de Discovery — BienestarPro

**Fase:** 0
**Fecha de apertura:** 2026-10-08
**Responsable general:** Nelson Fabián Gallego Sánchez (semillerista SENNOVA / desarrollador principal)
**Acompañamiento:** director del grupo de investigación SENNOVA + líder SENNOVA del Centro de Comercio y Turismo

---

## 1. Objetivo

Entender el proceso real del área de Bienestar al Aprendiz, cuantificar el dolor actual (reprocesos, tiempos, comunicación) y producir los insumos que alimentan los requisitos (Fase 1), la arquitectura (Fase 2) y el protocolo de investigación SENNOVA.

## 2. Alcance del levantamiento

**Sí se levanta:**
- Proceso completo de refrigerios: convocatoria, asignación, entrega y cierre.
- Comunicación actual del área (canales, volúmenes, pérdidas de información).
- Proceso de registro de portátiles (diagnóstico para Fase 5).
- Prácticas actuales de: noticias/campañas, encuestas, reuniones, directorio de fichas y contactos de emergencia.

**No se levanta (queda para fases posteriores):**
- Diseño técnico detallado de la solución.
- Integraciones con sistemas institucionales (Sofía Plus, Territorium): solo se identifican datos y restricciones.

## 3. Actores y técnicas

| Actor | Técnica principal | Instrumento |
|---|---|---|
| Coordinación de Bienestar | Entrevista semiestructurada | `01-guion-entrevistas.md` |
| Auxiliar de entrega de refrigerios | Entrevista + observación | `01` y `02` |
| Cafetería (preparación) | Entrevista corta | `01` |
| Portería / vigilancia | Entrevista + observación | `01` y `02` |
| Aprendices (2–3 programas, jornadas distintas) | Grupo focal corto | `01` |
| Voceros y subvoceros | Entrevista grupal | `01` |
| Instructores y directores de ficha | Entrevista | `01` |
| Sistemas/TI del centro | Entrevista técnica | `01` |
| Líder SENNOVA + director de grupo | Entrevista de marco investigativo | `01` + `07-checklist-sennova.md` |

## 4. Cronograma sugerido (2 semanas)

| Semana | Actividades |
|---|---|
| Semana 1 | Análisis documental (`03`) + entrevistas (7 de 9 actores) |
| Semana 2 | Observación de jornada real (`02`) + entrevistas restantes + métricas de línea base (`05`) + AS-IS (`04`) + acta (`06`) |

## 5. Artefactos de salida

1. Este plan.
2. Guion de entrevistas diligenciado (notas por actor).
3. Fichas de observación completadas.
4. Inventario documental con anexos.
5. Diagrama y descripción AS-IS (refrigerios + portátiles).
6. Baseline de métricas (una semana típica).
7. Acta de hallazgos validada por el área.
8. Checklists SENNOVA y Meta/WhatsApp en estado inicial.

## 6. Ética y tratamiento de datos

- Toda entrevista requiere consentimiento informado (`09-consentimiento-informado.md`).
- No se registran datos personales de aprendices en las notas; los conteos se agregan.
- Si participan menores de edad: autorización de representante legal y ninguna grabación sin ella.
- Las grabaciones (si se autorizan) se almacenan cifradas y se eliminan al cierre de la fase.

## 7. Riesgos del discovery

| Riesgo | Mitigación |
|---|---|
| Baja disponibilidad de los actores | Entrevistas de máximo 45–60 min, agendadas con antelación |
| Respuestas "políticas" sobre fallas del proceso | Garantizar confidencialidad y enfoque en el proceso, no en personas |
| Datos sensibles expuestos | Consentimiento + agregación de datos |

---

## 8. Estado de avance

**Estado de los artefactos (2026-10-09):**

| Artefacto | Estado | Bloquea a |
|---|---|---|
| `00-plan-discovery.md` | Completo | — |
| `01-guion-entrevistas.md` | Completo (9 actores) | — |
| `02-plantilla-observacion.md` | Completo | — |
| `03-inventario-documental.md` | Completo | — |
| `04-as-is-refrigerios.md` | **Plantilla** — falta diligenciar con observación y entrevistas | Puntos de dolor y oportunidades → requisitos |
| `05-baseline-metricas.md` | **Plantilla** — 17 métricas definidas, falta capturar valores | Justificación cuantificada del proyecto |
| `06-acta-hallazgos.md` | **Plantilla** — depende de las fichas de sesión | Cierre de Fase 0 |
| `07-checklist-sennova.md` / `08-checklist-meta-whatsapp.md` | En estado inicial | Habilitación de canales |
| `09-consentimiento-informado.md` | Completo | — |
| `10-plan-contactos-y-reuniones.md` | Completo; **tabla de agendamiento vacía** | Inicio de sesiones |
| `12-ficha-registro-sesion.md` | Completo (nuevo) | — |
| `docs/01-requisitos/00-matriz-trazabilidad-inicial.md` | Esqueleto (nuevo) | Fase 1 |

**Qué falta para cerrar la Fase 0:**

1. Agendar y ejecutar las 9 sesiones (`10`, sección 4), empezando por el líder SENNOVA y la Coordinación de Bienestar.
2. Diligenciar una ficha por sesión (`12`) el mismo día de cada reunión.
3. Observar una jornada real de entrega (`02`) para completar el AS-IS (`04`).
4. Capturar las 17 métricas de línea base (`05`) en una semana típica y una pico.
5. Consolidar el acta de hallazgos (`06`) y validarla con el área.
6. Cerrar la matriz de trazabilidad (`docs/01-requisitos/00-matriz-trazabilidad-inicial.md`) para dar paso a la especificación de requisitos.
