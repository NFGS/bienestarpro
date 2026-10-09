# ADR-0014: Motor de investigación RAG local (Open Notebook) y política de conservación de archivos

- **Estado:** Aceptada
- **Fecha:** 2026-10-09
- **Ámbito:** Investigación y evidencia del proyecto (herramienta interna). **No** es el RAG del producto, que se rige por el [ADR-0009](./README.md).

## Contexto y problema

El proyecto necesita responder preguntas sobre su corpus (libros de metodología e ingeniería, normativa SENA, notas propias) **con citas verificables**, para sustentar el protocolo de investigación SENNOVA y los entregables ADSO. Restricciones reales del entorno:

-Equipo de una sola persona, equipo con **15 GB de RAM y GPU AMD integrada** (sin NVIDIA).
- El corpus incluye obras con licencia: no se puede exponer su contenido a servicios sin control.
- Durante la puesta en marcha ocurrieron tres fallos encadenados (credencial de embeddings corrupta, bucle del worker por comandos huérfanos, y un gateway de modelos incompatible) que consumieron tiempo y dejaron el motor inutilizable durante un día.
- Los `docker-compose.yml` del despliegue **no existían**: el servicio corría sin configuración reproducible, lo que impide reconstruirlo y auditarlo.

## Opciones consideradas

| Opción | Evaluación | Decisión |
|---|---|---|
| **Open Notebook en Docker (SurrealDB + bind mounts)** | Motor RAG completo con notas, fuentes y citas; instalable local; auditable | **Elegida** |
| Reutilizar el RAG del producto (Ollama + pgvector) | Descartada: mezcla herramienta de investigación con producto; no da notas ni gestión de corpus | Descartada |
| Consultar los libros con una API de IA (sin base local) | Descartada: sin corpus persistente, sin control de citas y con licencia expuesta | Descartada |
| LLM de chat local | Descartada: no cabe con calidad aceptable en 15 GB sin GPU | Descartada |
| Conservar gateway de modelos anterior (OpenCode Go) | Descartada: exige un header que este build no envía (`400 MissingSessionID`) | Descartada |

## Decisión

Se adopta **Open Notebook** como motor de investigación, con estas reglas:

- **D1 — Despliegue:** Open Notebook en Docker, con SurrealDB y datos en **bind mounts** del host, red host para la aplicación y base de datos limitada a `127.0.0.1`. La configuración se versiona **sin secretos** (`.env` real con permisos `600`, fuera del repositorio; `.env.example` versionado).
- **D2 — Embeddings locales:** `qwen3-embedding:0.6b` en Ollama (1024 dimensiones). El texto del corpus **no sale de la máquina**.
- **D3 — Chat en nube:** Google AI (Gemini). Se acepta enviar el *contexto recuperado* al proveedor porque el hardware no permite un LLM local usable; las obras con licencia se mantienen en la base local y solo se envía el fragmento consultado.
- **D4 — `auto_delete_files=no`:** se conservan los archivos subidos para poder reprocesar o re-embeber sin volver a cargarlos. Se acepta el costo de almacenamiento y de archivos huérfanos (borrar una fuente no borra su archivo).
- **D5 — `default_embedding_option=always`:** la carga del corpus es por lotes pequeños; se elimina el diálogo de confirmación por archivo.
- **D6 — No recrear contenedores durante una subida:** `restart` en lugar de `up -d`, para no interrumpir el procesamiento del lote en curso.
- **D7 — Medio de verificación:** el funcionamiento se documenta con evidencia ejecutada (búsqueda vectorial y pregunta con citas), registrada en `docs/00-discovery/`.

## Consecuencias

**Positivas**

- Corpus y citas verificables, requisito del rigor metodológico de SENNOVA y de la evaluación ADSO.
- El corpus con licencia permanece en disco local; solo sale el fragmento consultado.
- Despliegue reproducible y auditable desde el repositorio.
- Reprocesar documentos ya no obliga a volver a subirlos.

**Negativas y riesgos**

- Dependencia de un proveedor externo para el chat: límites de uso y caída del servicio (hoy ya se observó saturación de un modelo). Mitigación: tener más de un modelo registrado y reintentar.
- Los archivos huérfanos acumulan espacio (ya había 44 archivos, ~87 MB, de fuentes borradas). Mitigación: limpieza manual y solo con verificación previa de que la fuente ya no existe.
- El despliegue depende de una imagen local parcheada que no está en ningún registro: si se pierde, hay que reconstruirla. Mitigación: documentar el parche antes de actualizar la imagen.
- Activo crítico concentrado en dos directorios de una sola máquina. Mitigación: procedimiento de respaldo documentado (tar de `notebook_data` y `surreal_data`).

## Verificación

- Pregunta real con citas sobre el corpus: registrada en `docs/00-discovery/11-verificacion-paso-05-open-notebook.md`.
- Configuración de modelos y settings comprobados por API (`GET /api/settings`, `PUT /api/settings`).
- Despliegue validado con `docker compose config`; topología verificada con `docker inspect`.
- Operación y diagnóstico: `docs/02-arquitectura/open-notebook-motor-investigacion.md` e `infra/open-notebook/`.