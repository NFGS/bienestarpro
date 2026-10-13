-- Endurecimiento de las políticas RLS del directorio (M9).
-- Hallazgo de las pruebas de aislamiento: tras un `set_config(..., true)`
-- dentro de una transacción, PostgreSQL deja el GUC `app.centro_id` en
-- CADENA VACÍA (no NULL) al hacer commit. `''::uuid` lanza
-- "invalid input syntax for type uuid" en vez de denegar filas.
-- NULLIF lo convierte en NULL → la política evalúa falso (fail-closed)
-- sin error, en cualquier consulta sin contexto válido.

DROP POLICY "programs_tenant_isolation" ON "programs";
CREATE POLICY "programs_tenant_isolation" ON "programs"
  USING (center_id = NULLIF(current_setting('app.centro_id', true), '')::uuid)
  WITH CHECK (center_id = NULLIF(current_setting('app.centro_id', true), '')::uuid);
--> statement-breakpoint
DROP POLICY "groups_tenant_isolation" ON "groups";
CREATE POLICY "groups_tenant_isolation" ON "groups"
  USING (center_id = NULLIF(current_setting('app.centro_id', true), '')::uuid)
  WITH CHECK (center_id = NULLIF(current_setting('app.centro_id', true), '')::uuid);
--> statement-breakpoint
DROP POLICY "learners_tenant_isolation" ON "learners";
CREATE POLICY "learners_tenant_isolation" ON "learners"
  USING (center_id = NULLIF(current_setting('app.centro_id', true), '')::uuid)
  WITH CHECK (center_id = NULLIF(current_setting('app.centro_id', true), '')::uuid);
--> statement-breakpoint
DROP POLICY "group_instructors_tenant_isolation" ON "group_instructors";
CREATE POLICY "group_instructors_tenant_isolation" ON "group_instructors"
  USING (center_id = NULLIF(current_setting('app.centro_id', true), '')::uuid)
  WITH CHECK (center_id = NULLIF(current_setting('app.centro_id', true), '')::uuid);
--> statement-breakpoint
DROP POLICY "consents_tenant_isolation" ON "consents";
CREATE POLICY "consents_tenant_isolation" ON "consents"
  USING (center_id = NULLIF(current_setting('app.centro_id', true), '')::uuid)
  WITH CHECK (center_id = NULLIF(current_setting('app.centro_id', true), '')::uuid);
