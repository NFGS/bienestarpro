-- Políticas de Row-Level Security para el directorio maestro (M9).
-- Contexto por transacción: SELECT set_config('app.centro_id', <uuid>, true)
-- (ver DbService.withTenant en la API). Sin contexto las políticas no dejan
-- ver ni escribir filas (NULL = falso): el aislamiento falla en cerrado.
-- FORCE: incluso el propietario de la tabla respeta las políticas (ADR-0003).

ALTER TABLE "programs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "programs" FORCE ROW LEVEL SECURITY;
CREATE POLICY "programs_tenant_isolation" ON "programs"
  USING (center_id = current_setting('app.centro_id', true)::uuid)
  WITH CHECK (center_id = current_setting('app.centro_id', true)::uuid);

ALTER TABLE "groups" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "groups" FORCE ROW LEVEL SECURITY;
CREATE POLICY "groups_tenant_isolation" ON "groups"
  USING (center_id = current_setting('app.centro_id', true)::uuid)
  WITH CHECK (center_id = current_setting('app.centro_id', true)::uuid);

ALTER TABLE "learners" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "learners" FORCE ROW LEVEL SECURITY;
CREATE POLICY "learners_tenant_isolation" ON "learners"
  USING (center_id = current_setting('app.centro_id', true)::uuid)
  WITH CHECK (center_id = current_setting('app.centro_id', true)::uuid);

ALTER TABLE "group_instructors" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "group_instructors" FORCE ROW LEVEL SECURITY;
CREATE POLICY "group_instructors_tenant_isolation" ON "group_instructors"
  USING (center_id = current_setting('app.centro_id', true)::uuid)
  WITH CHECK (center_id = current_setting('app.centro_id', true)::uuid);

ALTER TABLE "consents" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "consents" FORCE ROW LEVEL SECURITY;
CREATE POLICY "consents_tenant_isolation" ON "consents"
  USING (center_id = current_setting('app.centro_id', true)::uuid)
  WITH CHECK (center_id = current_setting('app.centro_id', true)::uuid);
