#!/usr/bin/env bash
# -----------------------------------------------------------------
# open-notebook-reembed.sh — Reconstruye embeddings de Open Notebook
# con el modelo por defecto configurado (qwen3-embedding:0.6b).
#
# Uso:
#   ./open-notebook-reembed.sh           # reconstruye de inmediato
#   ./open-notebook-reembed.sh --wait    # espera a que terminen de procesar
#
# Requiere: curl, python3. API local en http://localhost:5055
# Nota: el proceso corre en el servidor de Open Notebook; este script
# solo lo dispara y hace seguimiento. Puede tardar horas en CPU.
# -----------------------------------------------------------------
set -euo pipefail

API="${OPEN_NOTEBOOK_API:-http://localhost:5055}"
MODE="${1:-}"

echo "== Open Notebook — reconstrucción de embeddings =="
echo "API: $API"

if [ "$MODE" = "--wait" ]; then
  echo "Esperando a que terminen de procesar todas las fuentes..."
  while true; do
    STATUS=$(curl -s --max-time 30 "$API/api/sources" | python3 -c "
import sys, json
d = json.load(sys.stdin)
items = d.get('sources') if isinstance(d, dict) and 'sources' in d else (d if isinstance(d, list) else d.get('items', []))
pending = sum(1 for i in items if (i.get('status') in ('new', 'running', 'queued', 'processing')) or i.get('status') is None)
print(pending)
")
    echo "  Fuentes pendientes: $STATUS"
    [ "$STATUS" = "0" ] && break
    sleep 60
  done
fi

echo "Disparando reconstrucción (mode=all)..."
RESP=$(curl -s -X POST "$API/api/embeddings/rebuild" \
  -H 'Content-Type: application/json' \
  -d '{"mode":"all","include_sources":true,"include_notes":true}')
echo "$RESP"
CMD_ID=$(echo "$RESP" | python3 -c "import sys,json; print(json.load(sys.stdin).get('command_id',''))")

if [ -z "$CMD_ID" ]; then
  echo "ERROR: no se obtuvo command_id"; exit 1
fi

echo "Seguimiento (Ctrl+C para salir; el proceso continúa en el servidor):"
while true; do
  curl -s --max-time 20 "$API/api/embeddings/rebuild/$CMD_ID/status" | python3 -c "
import sys, json
d = json.load(sys.stdin)
p = d.get('progress') or {}
s = d.get('stats') or {}
print(f\"  estado={d.get('status')} progreso={p.get('percentage', 0)}% ({p.get('processed', 0)}/{p.get('total', 0)}) fuentes={s.get('sources', 0)} fallos={s.get('failed', 0)}\")
"
  sleep 30
done
