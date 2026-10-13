-- RLS para los contactos de emergencia (M10) — mismo patrón NULLIF.

ALTER TABLE "emergency_contacts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "emergency_contacts" FORCE ROW LEVEL SECURITY;
CREATE POLICY "emergency_contacts_tenant_isolation" ON "emergency_contacts"
  USING (center_id = NULLIF(current_setting('app.centro_id', true), '')::uuid)
  WITH CHECK (center_id = NULLIF(current_setting('app.centro_id', true), '')::uuid);
