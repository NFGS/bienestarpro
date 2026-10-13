# Motor de investigación RAG — Open Notebook (operación y mantenimiento)

**Propósito:** documentar cómo está desplegado el motor de investigación del proyecto (el que permite consultar el corpus con citas verificables) y cómo mantenerlo. Complementa la [evidencia del paso 0.5](../00-discovery/11-verificacion-paso-05-open-notebook.md) y el [ADR-0014](../adr/ADR-0014-motor-investigacion-rag-open-notebook.md).

**Verificado:** 2026-10-09 contra el estado real de los contenedores (`docker inspect`), no contra documentación previa. Incluye el ciclo de recreación completa del despliegue. **Actualizado tras el upgrade a v1.15.0** (ver [ADR-0015](../adr/ADR-0015-upgrade-open-notebook-1-15.md)).

---

## 1. Por qué existe

El proyecto necesita consultar libros, normativa SENA y notas propias **con citas verificables** para sustentar el protocolo de investigación SENNOVA y los documentos ADSO. Ese motor **no es el RAG del producto** (que usa Ollama + pgvector, ver ADR-0009): es la herramienta de investigación y evidencia.

## 2. Topología verificada

| Elemento | Valor real | Por qué importa |
|---|---|---|
| Imagen de la app | `lfnovo/open_notebook:1.15.0` | **Oficial, pineada** desde 2026-10-09 ([ADR-0015](../adr/ADR-0015-upgrade-open-notebook-1-15.md)). La local parcheada `open_notebook:kimi-patched` (v1.10.0) quedó deprecada; su respaldo se conserva solo como rollback. |
| Red de la app | `network_mode: host` | Por eso no hay `ports`: con red host Docker los descarta. |
| API / UI | `localhost:5055` / `localhost:8502` | Endpoint de salud: **`/health`** (`/api/health` da 404). |
| Base de datos | `surrealdb/surrealdb:v2`, `127.0.0.1:8000` | Solo loopback; nunca expuesta a la red local. |
| Usuario de la BD | **`root`** (`user: "0:0"`) | Obligatorio: ver la nota siguiente. |
| Datos de la app | `~/open-notebook/notebook_data` → `/app/data` | Ajustes, notas, imágenes y `uploads/`. |
| Datos de la BD | `~/open-notebook/surreal_data` → `/mydata` | Dato real: `rocksdb:/mydata/mydatabase.db`. |
| Procesos | `supervisord`: api (uvicorn 5055), worker (comandos), frontend (node 8502) | Definidos en la imagen, no en el compose. |

> **SurrealDB debe correr como `root`.** `surreal_data` es de `root` en el host y la imagen usa por defecto el usuario `65532`, que no puede escribir. Sin `user: "0:0"` el servicio entra en bucle de reinicio con:
> `IO error: While renaming a /mydata/mydatabase.db/LOG.old.*: Permission denied`.
> Este detalle no era visible en los contenedores originales (el de la base se había creado con `docker run` y sin etiquetas de compose) y se descubrió al recrear el despliegue. Alternativa a futuro: cambiar el propietario del directorio al UID correcto y quitar la línea.

Los `docker-compose.yml` originales **no existían** en el directorio de despliegue (los contenedores corrían igual, con rutas referenciadas inexistentes). Se reconstruyeron a partir del estado real y se validaron con `docker compose config`.

- Archivos en vivo (con secretos): `~/open-notebook/`
- Copia sin secretos, versionada: [`infra/open-notebook/`](../../infra/open-notebook/)
- Secretos: `~/open-notebook/.env` (permisos `600`, en `.gitignore`); la plantilla `.env.example` sí se versiona.
- Contenedor antiguo de la base, conservado y detenido: `open-notebook-surrealdb-legacy` (se renombró para liberar el nombre y el puerto; no hace falta, sus datos están en el bind mount).

## 3. Configuración de modelos (verificada por API)

| Rol | Modelo | Dónde vive |
|---|---|---|
| Embeddings | `qwen3-embedding:0.6b` (Ollama local, 1024 dims) | Configurado en la UI de Open Notebook |
| Chat / transformación / herramientas / contexto largo | `gemini-3.5-flash-lite` (Google AI) | Configurado en la UI de Open Notebook |

Los embeddings son **locales**: el texto del corpus no sale de la máquina. El chat sí va a la nube (decisión D3 del ADR-0014), porque en 15 GB de RAM sin GPU NVIDIA no cabe un LLM local con calidad aceptable.

**Estado 2026-10-09:** el modelo de chat responde con error de autenticación de Google (`invalid authentication credentials`) → el `ask` con citas queda bloqueado hasta renovar la clave. **La búsqueda vectorial sigue operativa** porque no depende del proveedor (embeddings locales). Descartados: el gateway anterior (`OpenCode Go`, exige header `x-opencode-session` → `400 MissingSessionID`) y las API keys de Groq y OpenRouter (vencidas, 401).

> Detalle técnico: el campo de relevancia de la búsqueda vectorial se llama **`similarity`**, no `score`. Valores de referencia tras el despliegue recreado: 0.637 (guía del proyecto), 0.600 (política SENNOVA), 0.578 (portal SENNOVA).

## 4. Ajustes que no están en el compose

`auto_delete_files` y `default_embedding_option` son *settings* guardados en la base, modificables **en caliente sin reiniciar**:

```bash
curl -s http://localhost:5055/api/settings        # GET: leer

curl -s -X PUT http://localhost:5055/api/settings \
  -H 'Content-Type: application/json' \
  -d '{"auto_delete_files":"no","default_embedding_option":"always"}'
```

> Detalles que cuestan tiempo si se ignoran: el método es **`PUT`** (un `PATCH` devuelve `405`) y el valor para embeber siempre es **`always`** (los literales válidos son `ask|always|never`; un valor inválido devuelve `422` y no cambia nada).

Estado vigente: `auto_delete_files=no`, `default_embedding_option=always`.

**Por qué `auto_delete_files=no`:** permite reprocesar o re-embeber un documento sin volver a subirlo (el corpus sigue creciendo y habrá que re-embeber cuando cambie el modelo de embeddings). El costo es que los archivos de fuentes borradas quedan huérfanos en `uploads/`; al 2026-10-09 eran 41 archivos (~72 MB), incluidos documentos del 29 de junio.

**Por qué `default_embedding_option=always`:** la estrategia de carga es por lotes pequeños; con `ask` hay que confirmar un diálogo por cada archivo.

## 5. Operación

```bash
cd ~/open-notebook

docker compose config            # validar sin tocar nada
docker compose up -d             # (re)crear contenedores
docker compose ps                # estado y salud
docker compose logs -f open_notebook
docker compose restart open_notebook   # reinicia SIN recrear
docker compose down              # detiene; no borra datos (son bind mounts)
```

> **No recrear contenedores mientras se estén subiendo fuentes:** interrumpe el lote en curso. Con subidas activas, usar `restart`.

### Ciclo de recreación verificado (2026-10-09)

`docker compose up -d` puede fallar la primera vez por el nombre del contenedor de la base, que estaba creado a mano (`docker run`) y por tanto **sin etiquetas de compose**: Docker no lo reconoce como parte del proyecto y reporta `Conflict ... already in use`. Pasos que funcionaron:

```bash
docker stop open-notebook-surrealdb-1      # libera el puerto 8000
docker rename open-notebook-surrealdb-1 open-notebook-surrealdb-legacy
docker compose up -d                       # ahora sí crea ambos servicios
```

Después, la primera ejecución falla con SurrealDB en bucle por el usuario (ver sección 2). Corregido con `user: "0:0"`, el servicio quedó `healthy` en ambos contenedores.

### Actualización de versión (probado el 2026-10-09: 1.10.0 -> 1.15.0)

Ciclo probado: cambiar el pin en `docker-compose.yml` -> `docker pull` -> respaldo -> `docker compose up -d` (recrea solo la app; la base migra sola, versión 15 -> 25) -> verificar `/health`, `GET /api/settings` y worker en RUNNING. El parche kimi quedó deprecado: upstream cubre Kimi con el provider `anthropic_compatible` desde v1.14. Detalle y evidencia: [ADR-0015](../adr/ADR-0015-upgrade-open-notebook-1-15.md) y `MAINTENIMIENTO.md`.

### Respaldo automático

Script: [`infra/scripts/open-notebook-backup.sh`](../../infra/scripts/open-notebook-backup.sh) · Registros: `~/backups/open-notebook/` y `cron.log`.

- **Programado:** todos los días a las **02:30** por cron.
- **Qué respalda:** `notebook_data` + `surreal_data`, comprimidos y **verificados** (si el archivo no se puede leer, el script lo reporta como fallido).
- **Consistencia:** detiene los contenedores mientras comprime; los repone siempre, incluso si la compresión falla.
- **También guarda la imagen Docker legacy parcheada** (una sola vez, 581 MB), porque su código fuente (`apply_kimi_patch.py`) **no existe en disco**: es la vía de rollback tras el upgrade y sería irrecuperable sin ese archivo. La imagen en uso (oficial, pineada) es reproducible con `docker pull`.
- **No borra nada.** Cuando un respaldo supera los 30 días, el script solo *avisa* qué se puede limpiar; borrar es decisión del usuario.

Restauración manual:

```bash
cd ~/open-notebook
docker compose down
tar xzf ~/backups/open-notebook/open-notebook-AAAA-MM-DD_HHMM.tar.gz -C ~/open-notebook
docker compose up -d

# Restaurar la imagen legacy (rollback a v1.10.0; después hay que volver a
# fijar el pin viejo en docker-compose.yml antes de `docker compose up -d`)
gunzip -c ~/backups/open-notebook/image-open_notebook-kimi-patched.tar.gz | docker load
```

## 6. Diagnóstico de incidentes

| Síntoma | Causa probable | Acción |
|---|---|---|
| Una fuente nueva no procesa; logs repiten `NotFoundError` | Comandos huérfanos de fuentes borradas | Ver nota "comandos huérfanos" más abajo. |
| `NotFoundError` **persiste** aunque no haya huérfanos en la base | El worker conserva la cola en memoria | `docker compose restart open_notebook`. |
| SurrealDB reinicia en bucle con `Permission denied` | El compose no fija el usuario y la imagen usa 65532 sobre datos de `root` | Fijar `user: "0:0"` en el servicio `surrealdb`. |
| `Conflict: container name already in use` al recrear | Contenedor previo creado sin etiquetas de compose | `docker stop` + `docker rename` (ver sección 5). |
| El chat/`ask` falla con 500 `Authentication failed` | Credencial del proveedor rechazada (hoy Google AI) | Renovar la clave en Ajustes → Credenciales. La búsqueda vectorial no se ve afectada. |
| Embeddings fallan al cargar una fuente | Credencial de Ollama corrupta | Recrear la credencial y fijar `qwen3-embedding:0.6b`. |
| `PUT /api/settings` no cambia nada | Valor fuera de los literales válidos (`422`) | Usar `ask\|always\|never` y `yes\|no`. |
| El gateway anterior responde `400 MissingSessionID` | `OpenCode Go` incompatible con este build | No usarlo: trabajar con Google AI. |

### Comandos huérfanos: cómo detectarlos bien

Al borrar una fuente, sus comandos quedan en la base apuntando a una fuente inexistente y el worker reintenta en bucle. El campo con la referencia **no es una columna de primer nivel**: está dentro de `args.source_id` (y `args.note_id` para notas). Consultar solo un `source_id` de nivel superior da **falsos negativos** (se concluye que no hay huérfanos cuando sí los hay).

```sql
-- Detección correcta (desde POST http://localhost:8000/sql)
SELECT id, name, status, args FROM command;
-- un comando es huérfano si args.source_id no está en SELECT id FROM source
-- (o args.note_id no está en SELECT id FROM note)

-- Borrado (por id de registro; DELETE table WHERE ... no surte efecto aquí)
DELETE command:xxxxx; DELETE command:yyyyy;
```

Después de borrar, **reinicia el worker**: si no, sigue reintentando los comandos que ya tenía en memoria.

## 7. Límites conocidos

- La clave `OPEN_NOTEBOOK_ENCRYPTION_KEY` está en `~/open-notebook/.env`: si se pierde, las credenciales guardadas quedan inservibles.
- Los respaldos están en el **mismo disco** que los datos: protegen de errores y borrados accidentales, no de una falla del disco. Copiar además a un disco externo o nube cuando el corpus crezca.
- Ya **no** se depende de una imagen local irreproducible: la app corre sobre la imagen oficial pineada (`docker pull` la recupera). La imagen legacy parcheada sigue respaldada como vía de rollback.
- Google aplica límites de uso a Gemini: si el chat falla por demanda, es del proveedor y se resuelve reintentando o cambiando de modelo, no del despliegue.
- `~/open-notebook/` no es un repositorio git: la copia en el repo (`infra/open-notebook/`) **no se sincroniza sola**; si cambias uno, actualiza el otro y verifica con `diff`.