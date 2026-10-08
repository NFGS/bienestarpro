#!/usr/bin/env bash
# -----------------------------------------------------------------
# open-notebook-reembed.sh — Reconstruye embeddings de Open Notebook con
# el modelo por defecto (qwen3-embedding:0.6b) y ejecuta verificaciones
# de RAG (búsqueda vectorial + pregunta con citas) al finalizar.
#
# Uso:
#   ./open-notebook-reembed.sh           # reconstruye de inmediato
#   ./open-notebook-reembed.sh --wait    # espera a que la cola termine
#
# Requiere: curl, python3. API local en http://localhost:5055
# Nota: el rebuild corre en el servidor de Open Notebook; este script solo
# lo dispara, sigue el progreso y verifica. En CPU puede tardar horas.
# -----------------------------------------------------------------
set -uo pipefail

API="${OPEN_NOTEBOOK_API:-http://localhost:5055}"
NB="notebook:xdb7ojpts8f8mty0nltb"   # Notebook BienestarPro
MODEL_STRATEGY="model:minimax_m3"
MODEL_ANSWER="model:minimax_m3"
MODEL_FINAL="model:qwen3_7_max"
MODE="${1:-}"

log() { echo "[$(date '+%F %T')] $*"; }

pending_count() {
  curl -s --max-time 30 "$API/api/sources?notebook_id=$NB" 2>/dev/null | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    items = d.get('sources') if isinstance(d, dict) and 'sources' in d else d
    if not isinstance(items, list):
        items = []
    pending = sum(1 for i in items if str(i.get('status')) in ('new', 'running', 'queued', 'processing', 'None'))
    print(pending)
except Exception:
    print(-1)
"
}

log "== Open Notebook — reconstrucción de embeddings =="

if [ "$MODE" = "--wait" ]; then
  log "Esperando a que la cola de procesamiento termine (notebook BienestarPro)..."
  while true; do
    P=$(pending_count); P=${P:--1}
    if [ "$P" = "0" ]; then log "Cola terminada."; break; fi
    log "  Pendientes: $P (siguiente chequeo en 60 s)"
    sleep 60
  done
fi

log "Disparando reconstrucción de embeddings (mode=all)..."
RESP=$(curl -s --max-time 60 -X POST "$API/api/embeddings/rebuild" \
  -H 'Content-Type: application/json' \
  -d '{"mode":"all","include_sources":true,"include_notes":true}')
echo "  $RESP"
CMD_ID=$(echo "$RESP" | python3 -c "import sys,json; print(json.load(sys.stdin).get('command_id',''))" 2>/dev/null || true)
if [ -z "${CMD_ID:-}" ]; then log "[ERROR] No se obtuvo command_id"; exit 1; fi

log "Seguimiento del rebuild: $CMD_ID"
while true; do
  S=$(curl -s --max-time 30 "$API/api/embeddings/rebuild/$CMD_ID/status" 2>/dev/null | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    p = d.get('progress') or {}
    s = d.get('stats') or {}
    print('estado={} {}% ({}/{}) fuentes={} notas={} fallos={}'.format(
        d.get('status'), p.get('percentage', 0), p.get('processed', 0), p.get('total', 0),
        s.get('sources', 0), s.get('notes', 0), s.get('failed', 0)))
except Exception:
    print('estado=desconocido')
" || true)
  log "  $S"
  case "$S" in
    estado=completed*|estado=failed*) break ;;
  esac
  sleep 60
done

log "== Smoke test 1: búsqueda vectorial =="
curl -s --max-time 60 -X POST "$API/api/search" -H 'Content-Type: application/json' \
  -d '{"query":"cómo formular objetivos de investigación","type":"vector","limit":5,"search_sources":true,"search_notes":true}' \
  | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    res = d.get('results', [])
    print('resultados={}'.format(d.get('total_count', len(res))))
    for r in res[:5]:
        print('  -', str(r.get('title') or r.get('id') or '')[:80], '| score:', r.get('similarity') or r.get('relevance') or '')
except Exception as e:
    print('(respuesta no interpretable)', e)
"

log "== Smoke test 2: pregunta con citas (RAG) =="
curl -s --max-time 180 -X POST "$API/api/search/ask/simple" -H 'Content-Type: application/json' \
  -d "{\"question\":\"¿Cómo se formulan los objetivos de investigación en un proyecto?\",\"strategy_model\":\"$MODEL_STRATEGY\",\"answer_model\":\"$MODEL_ANSWER\",\"final_answer_model\":\"$MODEL_FINAL\"}" \
  | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    a = (d.get('answer') or '')
    print(a[:600] + ('…' if len(a) > 600 else ''))
except Exception as e:
    print('(respuesta no interpretable)', e)
"

log "== FIN =="
