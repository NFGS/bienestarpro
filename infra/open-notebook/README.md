# Open Notebook — despliegue reproducible (copia sin secretos)

Esta es la **copia sin secretos** de la configuración del despliegue local de Open Notebook, que vive en `~/open-notebook/`. Existe para que el despliegue sea reproducible y auditable desde el repositorio del proyecto (requisito de mantenibilidad y de evidencia del proyecto SENNOVA).

## Dónde está la verdad

| Qué | Dónde |
|---|---|
| Archivos que Docker usa en vivo | `~/open-notebook/` (`docker-compose.yml`, `docker-compose.override.yml`, `.env`) |
| Copia sin secretos (este directorio) | `infra/open-notebook/` |
| Script de respaldo | [`../scripts/open-notebook-backup.sh`](../scripts/open-notebook-backup.sh) |
| Datos y respaldos (no versionar) | `~/open-notebook/notebook_data/`, `~/open-notebook/surreal_data/`, `~/backups/open-notebook/` |

Al recrear contenedores: `cd ~/open-notebook && docker compose up -d` (ver el ciclo de recreación en la documentación operativa, porque la primera vez requiere liberar el nombre del contenedor antiguo).

## Cómo se gestiona el `.env`

- `~/open-notebook/.env` (permisos `600`) contiene los secretos reales: `OPEN_NOTEBOOK_ENCRYPTION_KEY`, credenciales de SurrealDB y `APP_PASSWORD`.
- Este directorio solo tiene `.env.example` con valores de ejemplo.
- El `.gitignore` del proyecto ignora `.env` y `.env.*` y **permite** `.env.example`.
- **Nunca** copies el `.env` real al repositorio.

## Topología (verificada con `docker inspect`, 2026-10-09)

- Imagen de la app: `open_notebook:kimi-patched` (imagen **local parcheada**, no está en ningún registro).
- Red de la app: `network_mode: host` → API en `:5055`, UI en `:8502`, sin `ports` (con red host Docker los descarta).
- SurrealDB: `surrealdb/surrealdb:v2`, solo en `127.0.0.1:8000`, y **con `user: "0:0"`** (obligatorio: los datos son de `root` en el host y la imagen usa por defecto el usuario `65532`).
- Datos: bind mounts `./notebook_data` (app) y `./surreal_data` (base).
- Endpoint de salud de la API: `/health` (no `/api/health`).

## Ajustes que NO están en el compose

`auto_delete_files` y `default_embedding_option` son *settings* en caliente, no variables de entorno:

```bash
# Leer
curl -s http://localhost:5055/api/settings

# Cambiar (es PUT; y para embeber siempre el valor es "always", no "yes")
curl -s -X PUT http://localhost:5055/api/settings \
  -H 'Content-Type: application/json' \
  -d '{"auto_delete_files":"no","default_embedding_option":"always"}'
```

Estado vigente (2026-10-09): `auto_delete_files=no`, `default_embedding_option=always`.

## Respaldos

- Copia de seguridad **automática diaria a las 02:30** (cron), con verificación del archivo.
- Respalda `notebook_data` + `surreal_data`, y **una sola vez la imagen Docker parcheada** (su código fuente no existe en disco).
- No borra nada: solo avisa qué respaldos superan los 30 días.
- Detalle y restauración: `docs/02-arquitectura/open-notebook-motor-investigacion.md`.

## Archivos de este directorio

| Archivo | Contenido |
|---|---|
| `docker-compose.yml` | Despliegue completo y fiel (idéntico al de `~/open-notebook/`). |
| `docker-compose.override.yml` | Variantes comentadas y sin efecto. |
| `.env.example` | Plantilla de secretos. |
| `README.md` | Este documento. |

> Nota: `~/open-notebook/` no es un repositorio git, así que la copia de este directorio **no se sincroniza automáticamente** con los archivos de `~/open-notebook/`. Si cambias uno, actualiza el otro (verifica con `diff`).