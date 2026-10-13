-- RLS para las tablas de refrigerios (M1) + función de confirmación pública.
-- Mismo patrón de aislamiento que el directorio (NULLIF sobre app.centro_id).

ALTER TABLE "events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "events" FORCE ROW LEVEL SECURITY;
CREATE POLICY "events_tenant_isolation" ON "events"
  USING (center_id = NULLIF(current_setting('app.centro_id', true), '')::uuid)
  WITH CHECK (center_id = NULLIF(current_setting('app.centro_id', true), '')::uuid);
--> statement-breakpoint
ALTER TABLE "event_groups" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "event_groups" FORCE ROW LEVEL SECURITY;
CREATE POLICY "event_groups_tenant_isolation" ON "event_groups"
  USING (center_id = NULLIF(current_setting('app.centro_id', true), '')::uuid)
  WITH CHECK (center_id = NULLIF(current_setting('app.centro_id', true), '')::uuid);
--> statement-breakpoint
ALTER TABLE "event_participants" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "event_participants" FORCE ROW LEVEL SECURITY;
CREATE POLICY "event_participants_tenant_isolation" ON "event_participants"
  USING (center_id = NULLIF(current_setting('app.centro_id', true), '')::uuid)
  WITH CHECK (center_id = NULLIF(current_setting('app.centro_id', true), '')::uuid);
--> statement-breakpoint
ALTER TABLE "deliveries" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "deliveries" FORCE ROW LEVEL SECURITY;
CREATE POLICY "deliveries_tenant_isolation" ON "deliveries"
  USING (center_id = NULLIF(current_setting('app.centro_id', true), '')::uuid)
  WITH CHECK (center_id = NULLIF(current_setting('app.centro_id', true), '')::uuid);
--> statement-breakpoint

-- Función de confirmación pública (RF-15): el aprendiz confirma desde el
-- enlace de la convocatoria SIN sesión; el token QR es la capacidad de
-- acceso. SECURITY DEFINER (corre como el propietario) permite resolver el
-- token antes de conocer el centro, con lógica acotada y search_path fijo.
CREATE OR REPLACE FUNCTION public.confirm_event_participation(
  p_token uuid,
  p_attending boolean
)
RETURNS TABLE (
  outcome text,
  participant_id uuid,
  event_id uuid,
  center_id uuid,
  learner_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_participant record;
  v_event record;
BEGIN
  SELECT id, event_id, center_id, learner_id
    INTO v_participant
    FROM event_participants
   WHERE qr_token = p_token
   FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT 'token_not_found'::text, NULL::uuid, NULL::uuid, NULL::uuid, NULL::uuid;
    RETURN;
  END IF;

  SELECT status, confirmation_deadline
    INTO v_event
    FROM events
   WHERE id = v_participant.event_id;

  IF v_event.status <> 'activo' THEN
    RETURN QUERY SELECT 'event_not_active'::text, v_participant.id, v_participant.event_id, v_participant.center_id, v_participant.learner_id;
    RETURN;
  END IF;

  IF v_event.confirmation_deadline IS NOT NULL
     AND now() > v_event.confirmation_deadline THEN
    RETURN QUERY SELECT 'deadline_passed'::text, v_participant.id, v_participant.event_id, v_participant.center_id, v_participant.learner_id;
    RETURN;
  END IF;

  UPDATE event_participants
     SET status = CASE WHEN p_attending THEN 'confirmado' ELSE 'rechazado' END,
         confirmed_at = now()
   WHERE id = v_participant.id;

  RETURN QUERY SELECT 'confirmed'::text, v_participant.id, v_participant.event_id, v_participant.center_id, v_participant.learner_id;
END;
$$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION public.confirm_event_participation(uuid, boolean) FROM PUBLIC;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.confirm_event_participation(uuid, boolean) TO bienestarpro_app;
