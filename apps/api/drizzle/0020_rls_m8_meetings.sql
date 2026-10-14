-- RLS para reuniones y agenda (M8) — mismo patrón NULLIF que M9/M1/M2/M10/M6/M7.

ALTER TABLE "meetings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "meetings" FORCE ROW LEVEL SECURITY;
CREATE POLICY "meetings_tenant_isolation" ON "meetings"
  USING (center_id = NULLIF(current_setting('app.centro_id', true), '')::uuid)
  WITH CHECK (center_id = NULLIF(current_setting('app.centro_id', true), '')::uuid);
--> statement-breakpoint
ALTER TABLE "meeting_invitees" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "meeting_invitees" FORCE ROW LEVEL SECURITY;
CREATE POLICY "meeting_invitees_tenant_isolation" ON "meeting_invitees"
  USING (center_id = NULLIF(current_setting('app.centro_id', true), '')::uuid)
  WITH CHECK (center_id = NULLIF(current_setting('app.centro_id', true), '')::uuid);
--> statement-breakpoint
ALTER TABLE "meeting_minutes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "meeting_minutes" FORCE ROW LEVEL SECURITY;
CREATE POLICY "meeting_minutes_tenant_isolation" ON "meeting_minutes"
  USING (center_id = NULLIF(current_setting('app.centro_id', true), '')::uuid)
  WITH CHECK (center_id = NULLIF(current_setting('app.centro_id', true), '')::uuid);
--> statement-breakpoint
ALTER TABLE "meeting_minute_revisions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "meeting_minute_revisions" FORCE ROW LEVEL SECURITY;
CREATE POLICY "meeting_minute_revisions_tenant_isolation" ON "meeting_minute_revisions"
  USING (center_id = NULLIF(current_setting('app.centro_id', true), '')::uuid)
  WITH CHECK (center_id = NULLIF(current_setting('app.centro_id', true), '')::uuid);
--> statement-breakpoint
-- Reclamo atómico de recordatorios vencidos (RF-38). El planificador corre
-- sin contexto de centro (todas las sedes): esta función SECURITY DEFINER
-- reclama en una sola sentencia (SKIP LOCKED evita dobles reclamos) y marca
-- el envío; el planificador después encola con el contexto de cada centro.
CREATE OR REPLACE FUNCTION public.claim_due_meeting_reminders(p_limit integer DEFAULT 20)
RETURNS SETOF public.meetings
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE meetings
     SET reminder_sent_at = now()
   WHERE id IN (
     SELECT id FROM meetings
      WHERE status = 'agendada'
        AND reminder_at IS NOT NULL
        AND reminder_sent_at IS NULL
        AND reminder_at <= now()
      ORDER BY reminder_at
      LIMIT p_limit
      FOR UPDATE SKIP LOCKED
   )
  RETURNING *;
$$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION public.claim_due_meeting_reminders(integer) FROM PUBLIC;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.claim_due_meeting_reminders(integer) TO bienestarpro_app;
