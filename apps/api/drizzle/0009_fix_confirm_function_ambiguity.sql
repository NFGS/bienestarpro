-- Corrección de la función de confirmación pública (0008): las columnas del
-- RETURNS TABLE (event_id, center_id, learner_id) son variables PL/pgSQL y
-- chocaban con las columnas de event_participants ("column reference is
-- ambiguous"). Se califica la consulta con alias.
-- Hallazgo: la prueba de integración M1 detectó el 500 al confirmar.

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
  SELECT ep.id AS participant_id, ep.event_id AS event_id,
         ep.center_id AS center_id, ep.learner_id AS learner_id
    INTO v_participant
    FROM event_participants ep
   WHERE ep.qr_token = p_token
   FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT 'token_not_found'::text, NULL::uuid, NULL::uuid, NULL::uuid, NULL::uuid;
    RETURN;
  END IF;

  SELECT e.status AS status, e.confirmation_deadline AS confirmation_deadline
    INTO v_event
    FROM events e
   WHERE e.id = v_participant.event_id;

  IF v_event.status <> 'activo' THEN
    RETURN QUERY SELECT 'event_not_active'::text, v_participant.participant_id, v_participant.event_id, v_participant.center_id, v_participant.learner_id;
    RETURN;
  END IF;

  IF v_event.confirmation_deadline IS NOT NULL
     AND now() > v_event.confirmation_deadline THEN
    RETURN QUERY SELECT 'deadline_passed'::text, v_participant.participant_id, v_participant.event_id, v_participant.center_id, v_participant.learner_id;
    RETURN;
  END IF;

  UPDATE event_participants ep
     SET status = CASE WHEN p_attending THEN 'confirmado' ELSE 'rechazado' END,
         confirmed_at = now()
   WHERE ep.id = v_participant.participant_id;

  RETURN QUERY SELECT 'confirmed'::text, v_participant.participant_id, v_participant.event_id, v_participant.center_id, v_participant.learner_id;
END;
$$;
