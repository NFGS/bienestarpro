#!/usr/bin/env bash
# -----------------------------------------------------------------
# open-notebook-backup.sh — Respaldo del motor de investigación de
# Open Notebook (notas, fuentes, ajustes y base de datos SurrealDB).
#
# Qué respalda:
#   ~/open-notebook/notebook_data  (notas, fuentes, ajustes, uploads)
#   ~/open-notebook/surreal_data   (base de datos RocksDB)
#
# Consistencia: detiene los contenedores mientras comprime. Sin esto, un
# archivo puede quedar a medio escribir y el respaldo no serviría.
#
# Verificación: al terminar comprueba que el archivo se puede leer. Un
# respaldo no verificado no es respaldo.
#
# Uso:
#   ./open-notebook-backup.sh
#
# Variables opcionales:
#   OPEN_NOTEBOOK_DIR            (por defecto: $HOME/open-notebook)
#   OPEN_NOTEBOOK_BACKUP_DIR     (por defecto: $HOME/backups/open-notebook)
#   OPEN_NOTEBOOK_BACKUP_KEEP    días que se avisan para limpiar (por defecto 30)
#   OPEN_NOTEBOOK_SAVE_IMAGE     1 = además guarda la imagen Docker legacy parcheada (rollback; 0 = no)
# -----------------------------------------------------------------
set -uo pipefail

BASE_DIR="${OPEN_NOTEBOOK_DIR:-$HOME/open-notebook}"
BACKUP_DIR="${OPEN_NOTEBOOK_BACKUP_DIR:-$HOME/backups/open-notebook}"
KEEP="${OPEN_NOTEBOOK_BACKUP_KEEP:-30}"
SAVE_IMAGE="${OPEN_NOTEBOOK_SAVE_IMAGE:-1}"
# Imagen LEGACY (v1.10.0 + parche kimi): única e irrecuperable → vía de rollback.
# La imagen en uso (oficial, pineada) es reproducible con `docker pull`.
IMAGE_NAME="open_notebook:kimi-patched"
STAMP="$(date '+%F_%H%M')"
ARCHIVE="$BACKUP_DIR/open-notebook-$STAMP.tar.gz"

log() { echo "[$(date '+%F %T')] $*"; }

mkdir -p "$BACKUP_DIR"

COMPOSE=(docker compose -f "$BASE_DIR/docker-compose.yml")
if ! "${COMPOSE[@]}" version >/dev/null 2>&1; then
  log "ERROR: no se puede usar docker compose en $BASE_DIR/docker-compose.yml"
  exit 1
fi

log "Inicio del respaldo -> $ARCHIVE"

# 1) Detener para comprimir de forma consistente
"${COMPOSE[@]}" stop >/dev/null 2>&1
log "Servicios detenidos."

# 2) Comprimir (si tar falla, hay que reponer aunque sea; por eso el ||)
tar -czf "$ARCHIVE" -C "$BASE_DIR" notebook_data surreal_data
TAR_RC=$?

# 3) Reponer siempre
"${COMPOSE[@]}" start >/dev/null 2>&1
log "Servicios repuestos."

if [ "$TAR_RC" -ne 0 ]; then
  log "ERROR: falló la compresión (código $TAR_RC). Revisar el archivo: $ARCHIVE"
  exit 1
fi

# 4) Verificar que el archivo se puede leer y que trae contenido esperado
SIZE="$(du -h "$ARCHIVE" | cut -f1)"
if tar -tzf "$ARCHIVE" >/dev/null 2>&1; then
  N_FILES="$(tar -tzf "$ARCHIVE" | wc -l)"
  if [ "$N_FILES" -lt 10 ]; then
    log "AVISO: el archivo se lee pero trae solo $N_FILES entradas; revisa."
  fi
  log "Respaldo verificado: $SIZE, $N_FILES entradas."
else
  log "ERROR: el archivo no se puede leer. NO está respaldado."
  exit 1
fi

# 5) Imagen legacy parcheada (v1.10.0+kimi): su código fuente (apply_kimi_patch.py)
#    no existe en disco — irrecuperable si se pierde y única vía de rollback
#    tras el upgrade. Se guarda una sola vez.
if [ "$SAVE_IMAGE" = "1" ]; then
  IMG_ARCHIVE="$BACKUP_DIR/image-$(echo "$IMAGE_NAME" | tr ':/' '--').tar.gz"
  if [ -f "$IMG_ARCHIVE" ]; then
    log "Imagen ya respaldada: $IMG_ARCHIVE"
  else
    if command -v docker >/dev/null 2>&1 && docker image inspect "$IMAGE_NAME" >/dev/null 2>&1; then
      log "Respaldando imagen $IMAGE_NAME (una sola vez; puede tardar minutos)..."
      docker save "$IMAGE_NAME" | gzip > "$IMG_ARCHIVE"
      if [ -s "$IMG_ARCHIVE" ]; then
        log "Imagen respaldada: $IMG_ARCHIVE ($(du -h "$IMG_ARCHIVE" | cut -f1))"
        echo "Para restaurarla: gunzip -c '$IMG_ARCHIVE' | docker load"
      else
        log "AVISO: la imagen no se pudo guardar (archivo vacío)."
      fi
    else
      log "AVISO: la imagen $IMAGE_NAME no existe; se omite."
    fi
  fi
fi

# 6) Retención: este script NO borra nada. Solo avisa qué se puede limpiar,
#    porque borrar archivos es una decisión del usuario, no del proceso.
log "Archivos con más de $KEEP días (revisar y borrar si ya no se necesitan):"
find "$BACKUP_DIR" -maxdepth 1 -name 'open-notebook-*.tar.gz' -mtime "+$KEEP" -print | sed 's/^/  /'
find "$BACKUP_DIR" -maxdepth 1 -name 'open-notebook-*.tar.gz' -printf '  %TY-%Tm-%Td %TH:%TM  %10s  %p\n' 2>/dev/null | sort | tail -5

log "Espacio total ocupado por respaldos: $(du -sh "$BACKUP_DIR" | cut -f1)"
log "Fin del respaldo."