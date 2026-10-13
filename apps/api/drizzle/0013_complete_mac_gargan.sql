CREATE TABLE "emergency_contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"center_id" uuid NOT NULL,
	"learner_id" uuid NOT NULL,
	"name" text NOT NULL,
	"relationship" text NOT NULL,
	"phone" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "emergency_contacts" ADD CONSTRAINT "emergency_contacts_center_id_centers_id_fk" FOREIGN KEY ("center_id") REFERENCES "public"."centers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "emergency_contacts" ADD CONSTRAINT "emergency_contacts_learner_id_learners_id_fk" FOREIGN KEY ("learner_id") REFERENCES "public"."learners"("id") ON DELETE no action ON UPDATE no action;