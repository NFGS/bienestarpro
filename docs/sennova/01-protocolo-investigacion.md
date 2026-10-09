# Protocolo de Investigación — BienestarPro

**Estado:** Esqueleto inicial (los campos marcados `[Fase 1]` se completan con el discovery y las fuentes del notebook).
**Fecha de apertura:** 2026-10-08.
**Formato:** alineado a la estructura estándar de protocolo de investigación; se ajustará a los formatos vigentes del grupo SENNOVA `[Fase 1 — reunión con líder]`.

---

## 0. Información del proyecto

| Campo | Valor |
|---|---|
| Título provisional | BienestarPro: sistema de gestión integral de bienestar al aprendiz con notificaciones multicanal — caso Centro de Comercio y Turismo (SENA, Armenia) |
| Grupo de investigación | [Fase 1 — por confirmar] |
| Línea de investigación | [Fase 1 — por confirmar] |
| Director de grupo / Investigador principal | [Fase 1 — por confirmar] |
| Semillerista | Nelson Fabián Gallego Sánchez |
| Duración estimada | [Fase 1 — definir con el grupo] |
| Nivel de madurez (TRL) objetivo | TRL 6–7 al cierre del piloto (validación en entorno real) |

## 1. Planteamiento del problema

`[Fase 1 — se alimenta del discovery]`

- **Contexto:** área de Bienestar al Aprendiz con poco personal para múltiples funciones, comunicación informal y procesos manuales.
- **Situación problemática (cuantificada):** `[pegar métricas baseline: reprocesos/semana, tiempo de planilla, % no reclamado, mensajes, etc.]`
- **Pregunta de investigación (provisional):** ¿Cómo optimizar la gestión operativa y la comunicación del área de Bienestar al Aprendiz de un centro de formación del SENA mediante una plataforma web multi-canal y automatizada?
- **Delimitación:** Centro de Comercio y Turismo (Armenia, Quindío), semestre `[Fase 1]`, procesos de refrigerios, comunicación institucional y registro de equipos.

## 2. Justificación

`[Fase 1]`

- **Técnica:** arquitectura modular open source, multi-centro, offline-first.
- **Social:** reduce filas, desperdicio y desinformación; mejora la experiencia de aprendices e instructores.
- **Económica:** menor sobreproducción de refrigerios; operación con costo casi nulo (stack OSS + capas gratuitas en piloto).
- **Institucional:** alineada con la transformación digital del SENA (PETIC 2023–2026) y replicable a otros centros.

## 3. Objetivos

### Objetivo general

Desarrollar y validar una plataforma web (PWA) que automatice la asignación y entrega de refrigerios, las notificaciones multicanal y los servicios de comunicación del área de Bienestar al Aprendiz del Centro de Comercio y Turismo, con potencial de replicación multi-centro.

### Objetivos específicos (SMART — ajustar en Fase 1)

1. Levantar y modelar el proceso actual (AS-IS) del área, cuantificando el dolor con métricas de línea base al `[fecha]`.
2. Diseñar la arquitectura del sistema (multi-tenant, hub de notificaciones, PWA offline) documentada con ADRs al `[fecha]`.
3. Implementar los módulos del piloto (refrigerios, notificaciones, fichas, contactos, noticias, encuestas, reuniones e informes) con pruebas automatizadas.
4. Validar el sistema en un piloto real (1–2 fichas) midiendo métricas pre/post (reprocesos, tiempos, desperdicio, satisfacción).
5. Formular el plan de apropiación social y transferencia (capacitaciones, cartilla, manuales) para el centro.

## 4. Marco referencial

`[Fase 1–2 — construcción con Open Notebook: [MI] metodología, [IS] ingeniería, [SEN] normativa]`

- **Marco normativo:** Ley 1581 de 2012; lineamientos SENA/SENNOVA; PETIC 2023–2026; Reglamento del Aprendiz.
- **Estado del arte:** sistemas de notificación institucional multicanal; PWAs para contextos de baja conectividad; RAG aplicado a normativa institucional.
- **Marco teórico:** `[secciones desde los libros de metodología e ingeniería]`
- **Referencias preliminares (APA 7):** `[en construcción]`

## 5. Metodología

- **Enfoque:** mixto (cuantitativo + cualitativo).
- **Diseño:** investigación aplicada + **Design Science Research (DSR)** + estudio de caso (el artefacto es el sistema y su evaluación es el piloto).
- **Fases metodológicas:** alineadas con las fases del proyecto (0–6), con iteraciones cortas verificadas.
- **Población y muestra:** aprendices e instructores del CCT (muestreo por conveniencia para grupos focales y encuestas).
- **Instrumentos:** entrevistas semiestructuradas, observación directa, encuestas (el módulo de encuestas del sistema se usa como instrumento), métricas del sistema, test de usabilidad (SUS).
- **Análisis:** descriptivo (métricas), comparación pre/post (piloto), análisis temático (cualitativo).
- **Ética:** consentimientos informados (incluido formato para menores), anonimato en encuestas, protección de datos (Ley 1581), datos sintéticos en desarrollo.

## 6. Resultados esperados y productos

| Tipología (Minciencias) | Producto | Medio de verificación |
|---|---|---|
| Desarrollo tecnológico | Software BienestarPro | Registro DNDA |
| Divulgación | Ponencia (REDCOLSI / eventos SENNOVA) | Certificado + memorias |
| Divulgación | Artículo | Publicación |
| Apropiación social | Capacitaciones al personal de bienestar | Listas de asistencia + certificados |
| Apropiación social | Cartilla/manual del sistema | Documento con evidencia de distribución |
| Formación RH CTeI | Semilleristas formados | Actas del grupo |

## 7. Impacto

- **Institucional:** mejora operativa medible en el CCT; modelo replicable a los 117 centros del SENA.
- **Académico:** aporte metodológico (DSR aplicado a procesos de bienestar institucional).
- **Social:** mejor experiencia de los aprendices; transparencia en la entrega de beneficios.

## 8. Cronograma preliminar

| Fase | Mes 1 | Mes 2 | Mes 3 | Mes 4 | Mes 5 | Mes 6 |
|---|---|---|---|---|---|---|
| 0. Discovery | ██ | | | | | |
| 1. Requisitos + protocolo | ██ | ██ | | | | |
| 2. Arquitectura + ADRs | | ██ | | | | |
| 3. UX + validación | | ██ | | | | |
| 4. Construcción + piloto | | | ██ | ██ | ██ | |
| 5. Post-piloto (portátiles, IA) | | | | | ██ | ██ |
| 6. Cierre + productos | | | | | | ██ |

`[Fase 1 — ajustar a la duración real acordada con el grupo y al calendario académico ADSO]`

## 9. Presupuesto estimado (contrapartida en especie)

| Rubro | Descripción | Valor aprox. |
|---|---|---|
| Infraestructura (piloto) | Capas gratuitas (Neon, Upstash, Render, Vercel) | $0 |
| Servicios de mensajería | WhatsApp utility (centavos/mensaje en Colombia) | < USD 5/mes |
| Equipos | Computador personal del semillerista | En especie |
| Tiempo de investigación | Horas del semillerista y acompañamiento del grupo | En especie |
| Software | Stack 100 % open source | $0 |

## 10. Referencias

`[Fase 1 — APA 7, construida con las notas del notebook de investigación]`

## 11. Anexos

- A. Plantillas de consentimiento informado (`docs/00-discovery/09-...`).
- B. Instrumentos (guion de entrevistas, encuesta de línea base).
- C. Evidencias del piloto (métricas, capturas, actas).
