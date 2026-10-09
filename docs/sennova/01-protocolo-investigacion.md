# Protocolo de Investigación — BienestarPro

**Estado:** Versión 0.9 — completa en estructura; campos que dependen del grupo SENNOVA se marcan como `[por confirmar]`.

**Fecha:** 2026-10-09

**Formato:** alineado a una estructura académica estándar para proyectos de investigación aplicada. Se ajustará a los formatos vigentes del grupo SENNOVA cuando se reciban.

---

## 0. Información del proyecto

| Campo | Valor |
|---|---|
| Título provisional | BienestarPro: sistema de gestión integral de bienestar al aprendiz con notificaciones multicanal — caso Centro de Comercio y Turismo (SENA, Armenia) |
| Grupo de investigación | `[por confirmar]` |
| Línea de investigación | `[por confirmar]` |
| Director de grupo / Investigador principal | `[por confirmar]` |
| Semillerista | Nelson Fabián Gallego Sánchez |
| Duración estimada | `[por confirmar con el grupo]` |
| Nivel de madurez (TRL) objetivo | TRL 6–7 al cierre del piloto (validación en entorno real) |
| Centro de formación | Centro de Comercio y Turismo — SENA Regional Quindío (Armenia) |

---

## 1. Planteamiento del problema

### 1.1 Contexto

El área de Bienestar al Aprendiz del Centro de Comercio y Turismo (SENA, Armenia) administra beneficios y servicios para una población de aprendices con un equipo reducido de funcionarios que cumplen múltiples funciones simultáneas: entrega de refrigerios, comunicación con fichas, registro de portátiles, noticias, encuestas, reuniones y directorio de contactos de emergencia. La operación se sostiene con herramientas manuales (planillas en Excel, cuadernos físicos) y comunicación informal (mensajes de WhatsApp individuales), sin un sistema centralizado que garantice trazabilidad, consistencia y oportunidad de la información.

### 1.2 Situación problemática

Los procesos actuales presentan cuellos de botella que se cuantificarán con la línea base (`docs/00-discovery/05-baseline-metricas.md`):

1. **Reprocesos:** la planilla de entrega se arma y corrige manualmente, lo que genera duplicidades y errores.
2. **Desperdicio:** refrigerios planificados que no se reclaman, sin un mecanismo para estimar con mayor precisión la demanda.
3. **Desinformación:** los avisos llegan tarde o no llegan, generando consultas repetitivas.
4. **Pérdida de información:** registros dispersos entre cuadernos, hojas de cálculo y chats, sin trazabilidad ni respaldo.

### 1.3 Pregunta de investigación

**Pregunta general:** ¿De qué manera una plataforma web progresiva (PWA), multicanal y automatizada optimiza la gestión operativa y la comunicación del área de Bienestar al Aprendiz del Centro de Comercio y Turismo del SENA, en comparación con el proceso manual actual?

**Preguntas específicas:**

1. ¿Cuáles son los cuellos de botella, reprocesos y desperdicios del proceso actual de refrigerios y comunicación, medidos con indicadores cuantificables?
2. ¿Qué características de usabilidad requiere la plataforma para ser operable por usuarios con baja alfabetización digital?
3. ¿Qué impacto tiene la automatización sobre los indicadores de operación (tiempos, reprocesos, desperdicio y consultas repetitivas) entre la línea base y el piloto?
4. ¿Qué condiciones técnicas e institucionales permiten replicar la solución a otros centros del SENA con costo de operación sostenible?

### 1.4 Delimitación

- **Espacial:** Centro de Comercio y Turismo, SENA Regional Quindío (Armenia).
- **Temporal:** 6 meses (fases 0–6), con piloto en el semestre `[por confirmar]`.
- **Temática:** refrigerios, notificaciones multicanal, fichas por jornada, contactos de emergencia, noticias y campañas, encuestas, reuniones e informes. El registro de portátiles se diagnostica en Fase 0 y se aborda en la etapa post-piloto (Fase 5).
- **Poblacional:** aprendices activos, instructores, funcionarios de bienestar, portería y cafetería del centro.

---

## 2. Justificación

- **Técnica:** se adopta una arquitectura modular, multi-tenant, PWA offline-first, con hub de notificaciones y automatización 100% en código (sin herramientas fair-code). Esto permite replicabilidad y control total sobre el código.
- **Social:** reduce filas, desperdicio y desinformación, mejorando la experiencia de aprendices, instructores y funcionarios del área de bienestar.
- **Económica:** menor sobreproducción de refrigerios, operación con costo casi nulo en piloto (stack open source + capas gratuitas) y potencial de ahorro al replicarse.
- **Institucional:** se alinea con la transformación digital del SENA (PETIC 2023–2026) y con la política de apropiación social del conocimiento del semillero SENNOVA.
- **Investigativa:** aplica Design Science Research (DSR) para generar un artefacto tecnológico evaluado con evidencia empírica (métricas pre/post), aportando conocimiento aplicable a procesos institucionales similares.

---

## 3. Objetivos

### Objetivo general

Desarrollar y validar una plataforma web progresiva (PWA) que automatice la asignación y entrega de refrigerios, las notificaciones multicanal y los servicios de comunicación del área de Bienestar al Aprendiz del Centro de Comercio y Turismo, con potencial de replicación multi-centro.

### Objetivos específicos

1. Levantar y modelar el proceso actual (AS-IS), cuantificando el dolor con métricas de línea base (`docs/00-discovery/05-baseline-metricas.md`) antes del piloto.
2. Diseñar la arquitectura del sistema (multi-tenant, hub de notificaciones, PWA offline-first) documentada con Architecture Decision Records (ADRs).
3. Implementar los módulos del piloto (refrigerios, notificaciones, fichas, contactos de emergencia, noticias y campañas, encuestas, reuniones e informes) con pruebas automatizadas cuando apliquen.
4. Validar el sistema en un piloto real (1–2 fichas), midiendo métricas pre/post (reprocesos, tiempos, desperdicio, consultas repetitivas y satisfacción) y aplicando la Escala de Usabilidad del Sistema (SUS).
5. Formular el plan de apropiación social y transferencia (capacitaciones, cartilla y manuales) para el área de Bienestar al Aprendiz.
6. Documentar los productos comprometidos (software, ponencia, artículo y apropiación social) con sus medios de verificación.

---

## 4. Marco referencial

### 4.1 Marco normativo

- Congreso de la República de Colombia. (2012). *Ley 1581 de 2012* (protección de datos personales). Diario Oficial No. 48.587. https://www.suin-juriscol.gov.co/viewDocument.asp?ruta=Leyes/1683257
- Presidencia de la República de Colombia. (2013). *Decreto 1377 de 2013* (reglamentación parcial de la Ley 1581 de 2012). https://www.suin-juriscol.gov.co/viewDocument.asp?ruta=Decretos/1276087
- Servicio Nacional de Aprendizaje (SENA). (vigente). *Reglamento del Aprendiz del SENA* (acuerdo vigente; verificar número con el grupo SENNOVA).
- Servicio Nacional de Aprendizaje (SENA). (2023–2026). *Plan Estratégico de Tecnologías de la Información y las Comunicaciones (PETIC) 2023–2026* (verificar vigencia con el grupo SENNOVA).

### 4.2 Estado del arte

La automatización de procesos administrativos con enfoque en usabilidad para usuarios con baja alfabetización digital ha mostrado que las aplicaciones web progresivas (PWA) permiten operar con conectividad intermitente y reducir la fricción de adopción (Charland & Leroux, 2011). En el ámbito de sistemas de información, el enfoque Design Science Research (DSR) permite generar artefactos tecnológicos evaluados empíricamente (Hevner, March, Park & Ram, 2004; Peffers, Tuunanen, Rothenberger & Chatterjee, 2007). La recuperación aumentada con generación (RAG) aplicada a corpus normativos e institucionales facilita la consulta con citas verificables (Lewis et al., 2020), lo cual se aprovecha en este proyecto para la verificación de evidencias con Open Notebook.

### 4.3 Marco teórico

- **Design Science Research (DSR):** metodología que guía la creación y evaluación rigurosa de un artefacto (Hevner et al., 2004; Peffers et al., 2007).
- **Ingeniería de software:** desarrollo modular, Clean Architecture, DDD ligero, pruebas y trazabilidad (Pressman & Maxim, 2015; Sommerville, 2016).
- **Usabilidad:** evaluación con SUS (Brooke, 1996) y principios de usabilidad (Nielsen, 1994), con énfasis en accesibilidad (W3C, 2018).
- **Calidad de software:** modelo SQuaRE (ISO/IEC 25010:2011) para definir criterios de aceptación verificables.
- **Protección de datos:** principios de finalidad, necesidad, consentimiento, minimización y responsabilidad (Ley 1581 de 2012; Decreto 1377 de 2013).

### 4.4 Referencias preliminares (APA 7)

- Brooke, J. (1996). SUS: A "quick and dirty" usability scale. En P. W. Jordan, B. Thomas, B. A. Weerdmeester & I. L. McClelland (Eds.), *Usability evaluation in industry* (pp. 189–194). Taylor & Francis.
- Charland, A. & Leroux, B. (2011). Mobile application development: Web vs. native. *Communications of the ACM*, 54(5), 49–53. https://doi.org/10.1145/1941487.1941504
- Hevner, A. R., March, S. T., Park, J. & Ram, S. (2004). Design science in information systems research. *MIS Quarterly*, 28(1), 75–105. https://doi.org/10.2307/25148625
- International Organization for Standardization. (2011). *ISO/IEC 25010:2011 Systems and software engineering — Systems and software Quality Requirements and Evaluation (SQuaRE) — System and software quality models*. https://www.iso.org/standard/35733.html
- Lewis, P., Perez, E., Piktus, A., Petroni, F., Karpukhin, V., Goyal, N., Küttler, H., Lewis, M., Yih, W.-t., Rocktäschel, T., Riedel, S. & Kiela, D. (2020). Retrieval-augmented generation for knowledge-intensive NLP tasks. En *Advances in Neural Information Processing Systems* (Vol. 33, pp. 9459–9474). https://proceedings.neurips.cc/paper/2020/hash/6b493230205f780e1bc26945df7481e5-Abstract.html
- Nielsen, J. (1994). *Usability engineering*. Morgan Kaufmann.
- Peffers, K., Tuunanen, T., Rothenberger, M. A. & Chatterjee, S. (2007). A design science research methodology for information systems research. *Journal of Management Information Systems*, 24(3), 45–77. https://doi.org/10.2753/MIS0742-1222240302
- Pressman, R. S. & Maxim, B. R. (2015). *Software engineering: A practitioner's approach* (8ª ed.). McGraw-Hill Education.
- Sommerville, I. (2016). *Software engineering* (10ª ed.). Pearson Education.
- World Wide Web Consortium. (2018). *Web Content Accessibility Guidelines (WCAG) 2.1*. https://www.w3.org/TR/WCAG21/

---

## 5. Metodología

### 5.1 Enfoque y diseño

Se adopta un enfoque **mixto** (cuantitativo-cualitativo) con **Design Science Research (DSR)** y **estudio de caso**. El artefacto es la plataforma BienestarPro y su evaluación se realiza mediante un piloto real en el Centro de Comercio y Turismo.

### 5.2 Metodología DSR (mapeada a las fases del proyecto)

Se sigue el modelo propuesto por Peffers et al. (2007), mapeado a las fases del proyecto:

| Fase DSR | Actividad | Fase del proyecto | Salida |
|---|---|---|---|
| 1. Identificación del problema | Levantamiento, AS-IS, métricas línea base | Fase 0 (Discovery) | `docs/00-discovery/*`, acta de hallazgos |
| 2. Definición de objetivos | ERS, casos de uso, historias de usuario, trazabilidad | Fase 1 (Requisitos) | `docs/01-requisitos/*`, matriz de trazabilidad |
| 3. Diseño y desarrollo | Arquitectura, ADRs, UX, implementación modular | Fases 2–4 (Arquitectura/UX/Construcción) | `docs/02-arquitectura/*`, `docs/03-ux/*`, código fuente |
| 4. Demostración | Piloto en 1–2 fichas | Fase 4 (Piloto) | Evidencias de operación, logs, capturas |
| 5. Evaluación | Comparación pre/post, SUS, verificación de requisitos | Fase 5 (Evaluación post-piloto) | Informe de evaluación con métricas |
| 6. Comunicación | Productos SENNOVA, apropiación social, cierre | Fase 6 (Cierre) | Ponencia, artículo, cartilla, manuales, acta de cierre |

### 5.3 Población y muestra

- **Población:** aprendices activos, instructores, funcionarios de bienestar, portería y cafetería del Centro de Comercio y Turismo (SENA, Armenia).
- **Muestra:** grupos focales (2–3 programas, distintas jornadas), encuesta de línea base (muestreo por conveniencia), piloto con 1–2 fichas. El tamaño exacto se registra en `docs/00-discovery/05-baseline-metricas.md`.

### 5.4 Instrumentos

- **Entrevistas semiestructuradas:** guion por actor (`docs/00-discovery/01-guion-entrevistas.md`).
- **Observación directa:** ficha de observación (`docs/00-discovery/02-plantilla-observacion.md`).
- **Encuestas:** módulo de encuestas de la plataforma (línea base y post-piloto).
- **Métricas operativas:** tiempos, reprocesos, desperdicio, consultas repetitivas (`docs/00-discovery/05-baseline-metricas.md`).
- **Usabilidad:** System Usability Scale (SUS) (Brooke, 1996).
- **Evidencias técnicas:** logs, capturas, trazabilidad RF↔HU↔prueba.

### 5.5 Técnicas de análisis

- **Cuantitativo:** estadística descriptiva (medias, porcentajes), comparación pre/post con las métricas definidas.
- **Cualitativo:** análisis temático de notas de entrevistas y grupos focales.
- **Técnico:** verificación de cumplimiento de requisitos, cobertura de pruebas cuando apliquen, revisión de código (SOLID, Clean Architecture).

### 5.6 Consideraciones éticas

- **Consentimiento informado:** se utiliza el formato `docs/00-discovery/09-consentimiento-informado.md`. Si participan menores de edad, se requiere autorización del representante legal.
- **Protección de datos:** cumplimiento de Ley 1581 de 2012 y Decreto 1377 de 2013. Principio de minimización: solo se registran datos estrictamente necesarios.
- **Anonimización:** en encuestas y grupos focales no se registran datos personales identificables; los conteos se agregan.
- **Grabaciones:** solo con autorización expresa, cifradas y eliminadas al cierre de la fase correspondiente.
- **Desarrollo:** datos sintéticos en desarrollo; nunca se commitean secretos ni datos personales reales.
- **Propiedad intelectual:** se seguirá la ruta definida con UPI/SAPI del SENA (verificar con el grupo SENNOVA).

---

## 6. Resultados esperados y productos comprometidos

| Tipología (Minciencias) | Producto | Medio de verificación |
|---|---|---|
| Desarrollo tecnológico | Software BienestarPro (código fuente + despliegue piloto) | Registro ante DNDA (cuando aplique) + evidencias de funcionamiento |
| Divulgación | Ponencia | Certificado de aceptación + memorias del evento (REDCOLSI u otro evento SENNOVA) |
| Divulgación | Artículo científico | Publicación aceptada o en proceso, con evidencia |
| Apropiación social | Capacitaciones al personal de Bienestar | Listas de asistencia + acta de capacitación |
| Apropiación social | Cartilla y manuales de usuario | Documento distribuido con evidencia de entrega |
| Formación RH CTeI | Semilleristas formados | Actas del grupo SENNOVA |

---

## 7. Impacto

- **Institucional:** mejora operativa medible en el CCT, con modelo replicable a otros centros del SENA.
- **Académico:** aporte metodológico (DSR aplicado a procesos de bienestar institucional), con trazabilidad completa y evidencias verificables.
- **Social:** mayor transparencia en la entrega de beneficios, reducción de desinformación y mejor experiencia para aprendices e instructores.
- **Técnico:** arquitectura modular, reutilizable y documentada con ADRs, lista para escalar.

---

## 8. Cronograma preliminar

| Fase | Mes 1 | Mes 2 | Mes 3 | Mes 4 | Mes 5 | Mes 6 |
|---|---|---|---|---|---|---|
| 0. Discovery | ███ | | | | | |
| 1. Requisitos + protocolo | ███ | ███ | | | | |
| 2. Arquitectura + ADRs | | ███ | | | | |
| 3. UX + validación | | ███ | | | | |
| 4. Construcción + piloto | | | ███ | ███ | ███ | |
| 5. Post-piloto (portátiles, IA) | | | | | ███ | ███ |
| 6. Cierre + productos | | | | | | ███ |

*[por confirmar con el grupo SENNOVA y calendario académico ADSO]*

---

## 9. Riesgos del proyecto

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Baja disponibilidad de actores para entrevistas | Media | Alto | Agendar con antelación, máximo 45–60 min, usar plantillas listas |
| Datos sensibles expuestos | Baja | Alto | Consentimiento, anonimización, datos sintéticos en desarrollo, revisión de secretos |
| Saturación de modelos de IA (chat) | Media | Medio | Tener modelos alternativos registrados (Gemini, MiniMax) y usar embeddings locales |
| Pérdida de datos del motor de investigación | Baja | Alto | Respaldos automáticos diarios de `notebook_data` y `surreal_data` |
| Retrasos por agenda institucional | Media | Medio | Cronograma flexible con holgura entre fases |

---

## 10. Presupuesto estimado (contrapartida en especie)

| Rubro | Descripción | Valor aprox. |
|---|---|---|
| Infraestructura (piloto) | Capas gratuitas (Neon/Upstash/Render/Vercel u equivalentes) | $0 USD |
| Servicios de mensajería | WhatsApp (uso mínimo para piloto) | < USD 5/mes |
| Equipos | Computador personal del semillerista | En especie |
| Tiempo de investigación | Horas del semillerista y acompañamiento del grupo | En especie |
| Software | Stack 100% open source | $0 USD |

---

## 11. Mapeo a los formatos del grupo SENNOVA

Cuando lleguen los formatos vigentes del grupo, este protocolo se transcribe así:

| Sección de este protocolo | Sección equivalente en formato del grupo | Observaciones |
|---|---|---|
| 0. Información del proyecto | Portada / identificación | Completar con datos oficiales del grupo |
| 1. Planteamiento del problema | Planteamiento del problema | Ajustar a extensión exigida |
| 2. Justificación | Justificación | Mantener argumentos técnicos/sociales/institucionales |
| 3. Objetivos | Objetivos | General + específicos |
| 4. Marco referencial | Marco teórico / estado del arte / marco normativo | Separar según formato |
| 5. Metodología | Metodología | Destacar DSR + mixto + estudio de caso |
| 6. Resultados esperados y productos | Productos comprometidos | Usar tipologías Minciencias |
| 7. Impacto | Impacto esperado | Ajustar redacción |
| 8. Cronograma | Cronograma de actividades | Ajustar a formato de tabla exigido |
| 9. Riesgos | Análisis de riesgos | Mantener mitigaciones |
| 10. Presupuesto | Presupuesto | Ajustar a formato oficial |
| 11. Referencias | Referencias bibliográficas | APA 7 (ya aplicado) |

---

## 12. Referencias

- Brooke, J. (1996). SUS: A "quick and dirty" usability scale. En P. W. Jordan, B. Thomas, B. A. Weerdmeester & I. L. McClelland (Eds.), *Usability evaluation in industry* (pp. 189–194). Taylor & Francis.
- Charland, A. & Leroux, B. (2011). Mobile application development: Web vs. native. *Communications of the ACM*, 54(5), 49–53. https://doi.org/10.1145/1941487.1941504
- Congreso de la República de Colombia. (2012). *Ley 1581 de 2012* (protección de datos personales). Diario Oficial No. 48.587. https://www.suin-juriscol.gov.co/viewDocument.asp?ruta=Leyes/1683257
- Hevner, A. R., March, S. T., Park, J. & Ram, S. (2004). Design science in information systems research. *MIS Quarterly*, 28(1), 75–105. https://doi.org/10.2307/25148625
- International Organization for Standardization. (2011). *ISO/IEC 25010:2011 Systems and software engineering — Systems and software Quality Requirements and Evaluation (SQuaRE) — System and software quality models*. https://www.iso.org/standard/35733.html
- Lewis, P., Perez, E., Piktus, A., Petroni, F., Karpukhin, V., Goyal, N., Küttler, H., Lewis, M., Yih, W.-t., Rocktäschel, T., Riedel, S. & Kiela, D. (2020). Retrieval-augmented generation for knowledge-intensive NLP tasks. En *Advances in Neural Information Processing Systems* (Vol. 33, pp. 9459–9474). https://proceedings.neurips.cc/paper/2020/hash/6b493230205f780e1bc26945df7481e5-Abstract.html
- Nielsen, J. (1994). *Usability engineering*. Morgan Kaufmann.
- Peffers, K., Tuunanen, T., Rothenberger, M. A. & Chatterjee, S. (2007). A design science research methodology for information systems research. *Journal of Management Information Systems*, 24(3), 45–77. https://doi.org/10.2753/MIS0742-1222240302
- Presidencia de la República de Colombia. (2013). *Decreto 1377 de 2013* (reglamentación parcial de la Ley 1581 de 2012). https://www.suin-juriscol.gov.co/viewDocument.asp?ruta=Decretos/1276087
- Pressman, R. S. & Maxim, B. R. (2015). *Software engineering: A practitioner's approach* (8ª ed.). McGraw-Hill Education.
- Servicio Nacional de Aprendizaje (SENA). (vigente). *Reglamento del Aprendiz del SENA* (acuerdo vigente; verificar número con el grupo SENNOVA).
- Servicio Nacional de Aprendizaje (SENA). (2023–2026). *Plan Estratégico de Tecnologías de la Información y las Comunicaciones (PETIC) 2023–2026* (verificar vigencia con el grupo SENNOVA).
- Sommerville, I. (2016). *Software engineering* (10ª ed.). Pearson Education.
- World Wide Web Consortium. (2018). *Web Content Accessibility Guidelines (WCAG) 2.1*. https://www.w3.org/TR/WCAG21/

---

## 13. Anexos

- A. Plantillas de consentimiento informado (`docs/00-discovery/09-consentimiento-informado.md`)
- B. Instrumentos (guion de entrevistas, ficha de observación, encuesta de línea base)
- C. Evidencias del discovery (AS-IS, baseline, acta de hallazgos)
- D. Ficha de registro de sesiones (`docs/00-discovery/12-ficha-registro-sesion.md`)
- E. Matriz de trazabilidad inicial (`docs/01-requisitos/00-matriz-trazabilidad-inicial.md`)
- F. Borradores de comunicación (`docs/00-discovery/13-borradores-comunicacion.md`)
- G. Verificación Open Notebook (`docs/00-discovery/11-verificacion-paso-05-open-notebook.md`)
- H. Motor de investigación (operación y mantenimiento) (`docs/02-arquitectura/open-notebook-motor-investigacion.md`)
- I. ADRs relevantes (`docs/adr/`)
