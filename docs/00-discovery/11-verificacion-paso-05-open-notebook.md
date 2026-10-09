# Verificación del Paso 0.5 — Open Notebook (RAG end-to-end)

**Fecha:** 2026-10-08
**Responsable:** operación técnica del proyecto (semillerista + agente)
**Estado:** CERRADO — criterio de aceptación cumplido

---

## 1. Objetivo del paso

Dejar Open Notebook operativo como motor de investigación: embeddings locales correctos, fuentes cargadas y capacidad de **responder preguntas con citas verificables (RAG)**.

## 2. Configuración final

| Componente | Valor |
|---|---|
| Embeddings | `qwen3-embedding:0.6b` (Ollama local, 1024 dimensiones) |
| Chat / transformación / tools / contexto grande | `gemini-3.5-flash-lite` (Google AI) |
| Notebooks | **BienestarPro** (fuentes [SEN] + guía) y AgroConnect (material de ficha) |
| Rebuild de embeddings | Completado: **44/44 ítems, 0 fallos** (43 fuentes + 1 nota) |

## 3. Incidencias resueltas durante la verificación

1. Credencial de Ollama corrupta (heredada) → recreada como "Ollama Local".
2. Modelo de embeddings inadecuado (`qwen2.5-coder:3b`) → reemplazado por `qwen3-embedding:0.6b`.
3. Eliminación masiva de fuentes desde la UI → comandos huérfanos → bucle de 1.962 crashes del worker → limpieza quirúrgica de la tabla de comandos + reinicio del servicio.
4. Gateway de modelos anterior (OpenCode Go) exige header `x-opencode-session` → rompía el chat/ask y parte del procesamiento → migrado a Google AI (Gemini), verificado funcional.
5. Bucle de re-embedding de una fuente (comando de proceso atascado) → comando raíz y duplicados eliminados.

## 4. Evidencia A — Búsqueda vectorial (funciona)

Consulta: `cómo formular objetivos de investigación` (tipo: vector)

| Resultado | Score |
|---|---|
| [PROY] Cómo investigar con este notebook — guía de uso | 0.6341 |
| [SEN] Documentos SENNOVA históricos (grupos, PI, política editorial) | 0.5416 |

## 5. Evidencia B — Pregunta con citas (RAG, aceptado)

**Pregunta:** "¿Cómo se formulan los objetivos de investigación en un proyecto? Responde en español y cita las fuentes."

**Respuesta (extracto):**

> "En los proyectos de investigación, la formulación de los objetivos es fundamental para delimitar el alcance, guiar el proceso metodológico y establecer qué se espera lograr al finalizar el trabajo `[note:6ksb8bpdgx8q9sasm37l, source:uca38vgqay92ws8euro9]`. Los objetivos surgen directamente de la identificación de la necesidad, el problema general y la situación analizada durante las primeras fases de diagnóstico del proyecto `[source:5iu7lvrzxyn1w4wbff1j]`.
>
> **1. Objetivo General:** … comienza siempre con un **verbo en infinitivo** … `[note:6ksb8bpdgx8q9sasm37l]`.
> **2. Objetivos Específicos:** … pasos lógicos, secuenciales, medibles y operativos … `[note:6ksb8bpdgx8q9sasm37l, source:5iu7lvrzxyn1w4wbff1j]`."

**Citas verificables:** la respuesta referencia la nota guía del notebook y fuentes reales cargadas (`source:uca38vgqay92ws8euro9`, `source:5iu7lvrzxyn1w4wbff1j`).

## 6. Conclusión

El criterio de aceptación del paso 0.5 queda cumplido: **búsqueda vectorial operativa + pregunta real respondida con citas**.

## 7. Pendientes derivados

- [x] Re-carga de libros: el usuario los está subiendo en lotes pequeños (el lote anterior se eliminó desde la UI porque el proceso se bloqueó).
- [x] Despliegue reconstruido y versionado sin secretos → ver [ADR-0014](../adr/ADR-0014-motor-investigacion-rag-open-notebook.md) y [`infra/open-notebook/`](../../infra/open-notebook/).
- [x] `auto_delete_files=no` aplicado (conserva archivos para reprocesar sin volver a subir).
- [ ] Copia de seguridad periódica de `notebook_data` y `surreal_data` (procedimiento documentado, aún no programado).
- [ ] Documentar el parche de la imagen `open_notebook:kimi-patched` antes de actualizar la imagen base.

## 8. Ver también

- Operación y mantenimiento: [`docs/02-arquitectura/open-notebook-motor-investigacion.md`](../02-arquitectura/open-notebook-motor-investigacion.md)

## 9. Verificación del despliegue reconstruido (2026-10-09)

Se reconstruyeron los `docker-compose.yml` ausentes y se probó el ciclo completo de recreación, lo que reveló dos fallos que solo aparecen al recrear:

| Hallazgo | Causa | Resolución |
|---|---|---|
| `Conflict: container name already in use` | El contenedor de SurrealDB se había creado con `docker run` (sin etiquetas de compose), por lo que Docker no lo reconocía como parte del proyecto | `docker stop` + `docker rename` (el antiguo queda como `open-notebook-surrealdb-legacy`, detenido y conservado) |
| SurrealDB en bucle: `IO error ... Permission denied` al renombrar `LOG` de RocksDB | La imagen corre como usuario `65532` y `surreal_data` es de `root` en el host | `user: "0:0"` en el servicio `surrealdb` |

**Bucle del worker por comandos huérfanos:** la detección inicial dio 0 huérfanos porque se consultó un `source_id` de primer nivel; la referencia real está en `args.source_id`. Con la definición correcta se detectaron **132 huérfanos** de fuentes borradas, se eliminaron y, tras reiniciar el worker (que conservaba la cola en memoria), los `NotFoundError` quedaron en **0**.

**Evidencia de funcionamiento tras la recreación:**

| Comprobación | Resultado |
|---|---|
| Contenedores | `open_notebook` y `surrealdb` en estado `healthy` |
| API `/health` | HTTP 200 |
| Persistencia de settings | `auto_delete_files=no`, `default_embedding_option=always` |
| Persistencia de modelos | chat y embeddings intactos |
| Datos | 16 fuentes en el cuaderno BienestarPro |
| Búsqueda vectorial | similitud 0.637 / 0.600 / 0.578 (campo `similarity`, no `score`) |
| Ask con citas | **Bloqueado**: Google AI rechaza la credencial (`invalid authentication credentials`) |

**Pendiente:** renovar la clave de Google AI para recuperar el `ask` con citas. La recuperación por búsqueda vectorial no depende de esa clave (embeddings locales) y sigue operativa.

**Respaldos:** programados diario a las 02:30, verificados en ejecución real (81 MB, 73 entradas, servicio repuesto en ~9 s) e incluyendo la imagen Docker parcheada (581 MB).
