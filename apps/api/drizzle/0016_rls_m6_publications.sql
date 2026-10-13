-- RLS para noticias y campañas (M6) — mismo patrón NULLIF.

ALTER TABLE "publications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "publications" FORCE ROW LEVEL SECURITY;
CREATE POLICY "publications_tenant_isolation" ON "publications"
  USING (center_id = NULLIF(current_setting('app.centro_id', true), '')::uuid)
  WITH CHECK (center_id = NULLIF(current_setting('app.centro_id', true), '')::uuid);
--> statement-breakpoint
ALTER TABLE "publication_segments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "publication_segments" FORCE ROW LEVEL SECURITY;
CREATE POLICY "publication_segments_tenant_isolation" ON "publication_segments"
  USING (center_id = NULLIF(current_setting('app.centro_id', true), '')::uuid)
  WITH CHECK (center_id = NULLIF(current_setting('app.centro_id', true), '')::uuid);
--> statement-breakpoint
ALTER TABLE "publication_metrics" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "publication_metrics" FORCE ROW LEVEL SECURITY;
CREATE POLICY "publication_metrics_tenant_isolation" ON "publication_metrics"
  USING (center_id = NULLIF(current_setting('app.centro_id', true), '')::uuid)
  WITH CHECK (center_id = NULLIF(current_setting('app.centro_id', true), '')::uuid);
