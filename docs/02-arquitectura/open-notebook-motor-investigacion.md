# Motor de investigación RAG — Open Notebook (operación y mantenimiento)

**Propósito:** documentar cómo está desplegado el motor de investigación del proyecto (el que permite consultar el corpus con citas verificables) y cómo mantenerlo. Complementa la [evidencia del paso 0.5](../00-discovery/11-verificacion-paso-05-open-notebook.md) y el [ADR-0014](../adr/ADR-0014-motor-investigacion-rag-open-notebook.md).

**Verificado:** 2026-10-09 contra el estado real de los contenedores (`docker inspect`), no contra documentación previa.

---

## 1. Por qué existe

El proyecto necesita consultar libros, normativa SENA y notas propias **con citas verificables** para sustentar el protocolo de investigación SENNOVA y los documentos ADSO. Ese motor **no es el RAG del producto** (que usa Ollama + pgvector, ver ADR-0009): es la herramienta de investigación y evidencia.

## 2. Topología verificada

| Elemento | Valor real | Por qué importa |
|---|---|---|
| Imagen de la app | `open_notebook:kimi-patched` | Imagen **local parcheada**; no existe en ningún registro. |
| Red de la app | `network_mode: host` | Por eso no hay `ports`: con red host Docker los descarta. |
| API / UI | `localhost:5055` / `localhost:8502` | Endpoint de salud: **`/health`** (`/api/health` da 404). |
| Base de datos | `surrealdb/surrealdb:v2`, `127.0.0.1:8000` | Solo loopback; nunca expuesta a la red local. |
| Datos de la app | `~/open-notebook/notebook_data` → `/app/data` | Ajustes, notas, imágenes y `uploads/`. |
| Datos de la BD | `~/open-notebook/surreal_data` → `/mydata` | Dato real: `rocksdb:/mydata/mydatabase.db`. |
| Procesos | `supervisord`: api (uvicorn 5055), worker (comandos), frontend (node 8502) | Definidos en la imagen, no en el compose. |

Los `docker-compose.yml` originales **no existían** en el directorio de despliegue (los contenedores corrían igual, con rutas referenciadas inexistentes). Se reconstruyeron a partir del estado real y se validaron con `docker compose config`.

- Archivos en vivo (con secretos): `~/open-notebook/`
- Copia sin secretos, versionada: [`infra/open-notebook/`](../../infra/open-notebook/)
- Secretos: `~/open-notebook/.env` (permisos `600`, en `.gitignore`); la plantilla `.env.example` sí se versiona.

## 3. Configuración de modelos (verificada por API)

| Rol | Modelo | Dónde vive |
|---|---|---|
| Embeddings | `qwen3-embedding:0.6b` (Ollama local, 1024 dims) | Configurado en la UI de Open Notebook |
| Chat / transformación / herramientas / contexto largo | `gemini-3.5-flash-lite` (Google AI) | Configurado en la UI de Open Notebook |

Los embeddings son **locales**: el texto del corpus no sale de la máquina. El chat sí va a la nube (decisión D3 del ADR-0014), porque en 15 GB de RAM sin GPU NVIDIA no cabe un LLM local con calidad aceptable.

Descartados: el gateway de modelos anterior (`OpenCode Go`), que exige un header `x-opencode-session` que este build no envía → `400 MissingSessionID`; y las API keys de Groq y OpenRouter, que están **vencidas** (401).

## 4. Ajustes que no están en el compose

`auto_delete_files` y `default_embedding_option` son *settings* guardados en la base, modificables **en caliente sin reiniciar**:

```bash
curl -s http://localhost:5055/api/settings        # GET: leer

curl -s -X PUT http://localhost:5055/api/settings \
  -H 'Content-Type: application/json' \
  -d '{"auto_delete_files":"no","default_embedding_option":"always"}'
```

> Detalles que cuestan tiempo si se ignoran: el método es **`PUT`** (un `PATCH` devuelve `405`) y el valor para embeber siempre es **`always`** (los literales válidos son `ask|always|never`; `yes` devuelve `422` y no cambia nada).

Estado vigente: `auto_delete_files=no`, `default_embedding_option=always`.

**Por qué `auto_delete_files=no`:** permite reprocesar o re-embeber un documento sin volver a subirlo (hoy el corpus sigue creciendo y habrá que re-embeber cuando cambie el modelo de embeddings). El costo es que los archivos de fuentes borradas quedan huérfanos en `uploads/`; al 2026-10-09 eran 44 archivos (~87 MB), incluidos documentos del 29 de junio.

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

### Respaldo y restauración

Los datos viven en dos directorios del host; basta con copiarlos (con el servicio detenido para consistencia):

```bash
cd ~/open-notebook
docker compose stop

# Respaldar
tar czf ~/open-notebook-respaldo-$(date +%F).tar.gz notebook_data surreal_data

# Restaurar
tar xzf ~/open-notebook-respaldo-AAAA-MM-DD.tar.gz -C ~/open-notebook
docker compose start
```

## 6. Diagnóstico de incidentes

| Síntoma | Causa probable | Acción |
|---|---|---|
| Una fuente nueva no procesa; logs repiten `NotFoundError` | Comandos huérfanos tras borrar fuentes masivamente | `docker logs --since 10m open-notebook-open_notebook-1 2>&1 \| grep -c NotFoundError`; limpiar comandos huérfanos y reiniciar. |
| El chat/ask falla con `400 MissingSessionID` | Gateway `OpenCode Go` | No es el gateway: usar Google AI (Gemini). |
| Los embeddings fallan al cargar una fuente | Credencial de Ollama corrupta | Recrear la credencial y fijar `qwen3-embedding:0.6b`. |
| `PUT /api/settings` no cambia nada | Valor fuera de los literales válidos (`422`) | Usar `ask\|always\|never` y `yes\|no`. |

## 7. Límites conocidos

- La clave `OPEN_NOTEBOOK_ENCRYPTION_KEY` está en `~/open-notebook/.env`: si se pierde, las credenciales guardadas quedan inservibles.
- El despliegue es de una sola máquina: los dos directorios de datos son el activo crítico (ver sección 5).
- Google aplica límites de uso a Gemini: si el chat falla por demanda, es del proveedor y se resuelve reintentando o cambiando de modelo, no del despliegue.
- `~/open-notebook/` no es un repositorio git: la copia en el repo (`infra/open-notebook/`) **no se sincroniza sola**; si cambias uno, actualiza el otro y verifica con `diff`.