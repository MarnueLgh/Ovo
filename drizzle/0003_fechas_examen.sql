CREATE TABLE "exam_dates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subject_id" uuid NOT NULL,
	"unit_id" uuid,
	"on" date NOT NULL
);
--> statement-breakpoint
ALTER TABLE "exam_dates" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "exam_dates" ADD CONSTRAINT "exam_dates_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_dates" ADD CONSTRAINT "exam_dates_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE no action ON UPDATE no action;