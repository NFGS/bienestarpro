# ADR-0015: Actualizar Open Notebook de la imagen local parcheada v1.10.0 a la imagen oficial v1.15.0 pineada

- **Estado:** Aceptada
- **Fecha:** 2026-10-12
- **Ámbito:** Herramienta interna de investigación (motor RAG Open Notebook). Complementa al [ADR-0014](./ADR-0014-motor-investigacion-rag-open-notebook.md), del que hereda la topología y las reglas de operación.
- **Relacionados:** [ADR-0014](./ADR-0014-motor-investigacion-rag-open-notebook.md), [ADR-0009](./README.md) (RAG del producto, no afectado por esta decisión).

## Contexto y problema

El despliegue local del motor de investigación en `~/open-notebook` corría una **imagen local `open_notebook:kimi-patched`**, basada en Open Notebook **v1.10.0** más un parche propio que solo modificaba `/app/open_notebook/ai/models.py` (aplicado vía `apply_kimi_patch.py` durante el build). Fuerzas y restricciones que obligan a decidir:

- **La imagen parcheada no existe en ningún registro Docker.** Si el host falla, solo el respaldo local (`docker save`) permite restaurarla; el código del parche ya no está en disco, por lo que el build no era reproducible.
- **El parche perdió su razón de ser.** No había ninguna credencial Kimi/Moonshot en la base (credenciales activas: `minimax`, `groq`, `ollama` x2, `google`, `openai`, `openrouter`). El parche llevaba tiempo sin efecto práctico.
- **Retraso acumulado de 5 versiones** (1.11, 1.12, 1.13, 1.14, 1.15). La última oficial es **v1.15.0** (publicada 2026-10-04).
- **El caso de uso Kimi quedó cubierto upstream.** Desde **v1.14.0** Open Notebook soporta nativamente endpoints Anthropic-Messages mediante el provider `anthropic_compatible` (pensado explícitamente para Kimi/Moonshot); **v1.15** añadió además SiliconFlow, que hospeda Kimi.
- **Sin migración de base de datos estructural.** SurrealDB se mantiene en `surrealdb/surrealdb:v2` tanto en la imagen oficial v1.15 como en el despliegue actual.
- **Incidente recurrente del worker:** los comandos huérfanos en cola (apuntaban a fuentes borradas vía `args.source_id`) provocaban que el worker entrara en bucle; la corrección del bucle por huérfanos y el fail-fast de fuentes fallidas llegaron en releases posteriores a v1.10.
- **Cliente MCP sin cambios.** El MCP de opencode (`open-notebook-mcp`, instalado con pipx) está en su última versión 0.3.0 según PyPI.
- **Estado de la cola en el momento de la actualización:** 30 comandos pendientes; 26 huérfanos (fuente borrada) y 4 con objetivo vivo.

## Opciones consideradas

| Opción | Evaluación | Decisión |
|---|---|---|
| **Imagen oficial pineada `lfnovo/open_notebook:1.15.0`** | Reproducible; incorpora bugfixes, seguridad y el provider `anthropic_compatible` de 5 releases; preserva la topología local y los datos | **Elegida** |
| Mantener la imagen parcheada (statu quo) | Cero riesgo de regresión inmediato, pero 5 versiones de retraso en mejoras y seguridad, incluida la corrección del bucle del worker por huérfanos y el fail-fast de fuentes fallidas | Rechazada |
| Reconstruir el parche sobre v1.15.0 | Sin credencial Kimi en uso y con el caso cubierto upstream, no aporta valor; además el build local no era reproducible | Rechazada |
| Imagen oficial tag mutable `v1-latest` | Actualizaciones automáticas sin editar el compose, a costa de perder reproducibilidad (un `pull` puede cambiar el binario sin control ni ADR) | Descartada a favor del pin |

## Decisión

Se adopta la **imagen oficial `lfnovo/open_notebook:1.15.0` PINADA** (se descarta el tag mutable `v1-latest`) en `~/open-notebook/docker-compose.yml`, con estas reglas:

- **D1 — Preservar topología:** `network_mode: host`, usuario `"0:0"` en SurrealDB, bind mounts `./notebook_data` y `./surreal_data`, y SurrealDB expuesto solo en loopback (`127.0.0.1`). No se altera la arquitectura validada en el ADR-0014.
- **D2 — Deprecar la imagen parcheada.** Si en el futuro se necesita Kimi/Moonshot, se configura como credencial `anthropic_compatible` (base URL `https://api.moonshot.ai/anthropic`) sin parches.
- **D3 — Limpiar la cola antes de recrear.** Se eliminan por `id` los 26 comandos huérfanos (apuntaban a fuentes borradas); se conservan los 4 con objetivo vivo.
- **D4 — Recrear el contenedor de aplicación** con la nueva imagen, dejando intactos SurrealDB, los bind mounts y las credenciales.
- **D5 — Rollback documentado.** Ante una regresión se restaura el respaldo verificado `open-notebook-2026-10-09_1850.tar.gz` y se recarga la imagen parcheada respaldada `image-open_notebook-kimi-patched.tar.gz` (`docker load`).

## Consecuencias

**Positivas**

- Bugfixes y parches de seguridad de 5 releases acumulados.
- Fin del incidente recurrente de worker en bucle por comandos huérfanos (corregido upstream) y fail-fast ante fuentes fallidas.
- Credenciales y ajustes (`default_embedding_option=always`, `auto_delete_files=no`) preservados sin reintroducción manual.
- Se elimina la dependencia de una imagen local no reproducible que no existía en ningún registro.
- Caso de uso Kimi cubierto de forma nativa (provider `anthropic_compatible`), sin mantener parches propios.

**Negativas y riesgos**

- **Downtime de ~1-2 min** en la recreación del contenedor (ya ejecutado).
- **2 comandos de embedding quedaron en estado `running` obsoleto** tras la recreación; se re-embeben con `BienestarPro/infra/scripts/open-notebook-reembed.sh`.
- **Migración de cifrado PBKDF2 de v1.15 pospuesta** a una ventana posterior: un rollback tras migrar exigiría restaurar el respaldo de base, por lo que se separa de la actualización para acotar el riesgo.
- **Costo aceptado del pin:** la próxima actualización requiere editar explícitamente el pin en el compose (a cambio de reproducibilidad total).

## Verificación

- Ambos contenedores `healthy`; versión **1.15.0** confirmada en `/app/pyproject.toml` del contenedor.
- Migraciones automáticas de base **15 → 25** aplicadas sin errores.
- `GET /api/settings` confirma `default_embedding_option=always` y `auto_delete_files=no` (valores previos intactos).
- La API responde con Bearer token; `GET /api/notebooks` y `POST /api/search` (búsqueda vectorial) devuelven datos.
- `worker`, `api` y `frontend` en estado `RUNNING` bajo supervisord.
- Respaldo de rollback verificado y disponible: `open-notebook-2026-10-09_1850.tar.gz` + `image-open_notebook-kimi-patched.tar.gz`.
