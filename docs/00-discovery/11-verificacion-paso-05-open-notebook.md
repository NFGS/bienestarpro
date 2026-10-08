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

- [ ] Re-carga de libros (el lote anterior fue eliminado desde la UI el 2026-10-08): definir plan con el usuario.
- [ ] Evaluar `auto_delete_files=no` para conservar archivos subidos (recuperabilidad).
- [ ] Regenerar los `docker-compose.yml` de Open Notebook (no presentes en `~/open-notebook/`).
