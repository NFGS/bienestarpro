-- RLS para encuestas (M7) — mismo patrón NULLIF que M9/M1/M2/M10/M6.

ALTER TABLE "surveys" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "surveys" FORCE ROW LEVEL SECURITY;
CREATE POLICY "surveys_tenant_isolation" ON "surveys"
  USING (center_id = NULLIF(current_setting('app.centro_id', true), '')::uuid)
  WITH CHECK (center_id = NULLIF(current_setting('app.centro_id', true), '')::uuid);
--> statement-breakpoint
ALTER TABLE "survey_questions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "survey_questions" FORCE ROW LEVEL SECURITY;
CREATE POLICY "survey_questions_tenant_isolation" ON "survey_questions"
  USING (center_id = NULLIF(current_setting('app.centro_id', true), '')::uuid)
  WITH CHECK (center_id = NULLIF(current_setting('app.centro_id', true), '')::uuid);
--> statement-breakpoint
ALTER TABLE "survey_options" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "survey_options" FORCE ROW LEVEL SECURITY;
CREATE POLICY "survey_options_tenant_isolation" ON "survey_options"
  USING (center_id = NULLIF(current_setting('app.centro_id', true), '')::uuid)
  WITH CHECK (center_id = NULLIF(current_setting('app.centro_id', true), '')::uuid);
--> statement-breakpoint
ALTER TABLE "survey_segments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "survey_segments" FORCE ROW LEVEL SECURITY;
CREATE POLICY "survey_segments_tenant_isolation" ON "survey_segments"
  USING (center_id = NULLIF(current_setting('app.centro_id', true), '')::uuid)
  WITH CHECK (center_id = NULLIF(current_setting('app.centro_id', true), '')::uuid);
--> statement-breakpoint
ALTER TABLE "survey_responses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "survey_responses" FORCE ROW LEVEL SECURITY;
CREATE POLICY "survey_responses_tenant_isolation" ON "survey_responses"
  USING (center_id = NULLIF(current_setting('app.centro_id', true), '')::uuid)
  WITH CHECK (center_id = NULLIF(current_setting('app.centro_id', true), '')::uuid);
--> statement-breakpoint
ALTER TABLE "survey_answers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "survey_answers" FORCE ROW LEVEL SECURITY;
CREATE POLICY "survey_answers_tenant_isolation" ON "survey_answers"
  USING (center_id = NULLIF(current_setting('app.centro_id', true), '')::uuid)
  WITH CHECK (center_id = NULLIF(current_setting('app.centro_id', true), '')::uuid);
--> statement-breakpoint
-- Una sola respuesta identificada por aprendiz y encuesta (CU-28 FA-2).
-- Las respuestas anónimas (learner_id NULL) quedan fuera del índice para no
-- almacenar ningún identificador (RN-08).
CREATE UNIQUE INDEX "survey_responses_identified_unique"
  ON "survey_responses" ("survey_id", "learner_id")
  WHERE "learner_id" IS NOT NULL;
