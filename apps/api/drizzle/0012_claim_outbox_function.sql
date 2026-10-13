-- Reclamo atómico de filas del outbox para el relay de notificaciones (M2).
-- El relay corre sin contexto de centro (procesa todos los centros) y las
-- tablas tienen RLS: esta función SECURITY DEFINER reclama en una sola
-- sentencia (SKIP LOCKED evita dobles reclamos entre instancias) y devuelve
-- las filas al relay, que después procesa cada una con su contexto de centro.

CREATE OR REPLACE FUNCTION public.claim_pending_outbox(p_limit integer DEFAULT 20)
RETURNS SETOF public.outbox
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE outbox
     SET status = 'publicado',
         published_at = now()
   WHERE id IN (
     SELECT id FROM outbox
      WHERE status = 'pendiente'
      ORDER BY created_at
      LIMIT p_limit
      FOR UPDATE SKIP LOCKED
   )
  RETURNING *;
$$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION public.claim_pending_outbox(integer) FROM PUBLIC;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.claim_pending_outbox(integer) TO bienestarpro_app;
