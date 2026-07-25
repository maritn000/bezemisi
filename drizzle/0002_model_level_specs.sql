CREATE TABLE "vehicle_model_specifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"model_id" uuid NOT NULL,
	"field_key" text NOT NULL,
	"numeric_value" numeric(14, 4),
	"text_value" text,
	"boolean_value" boolean,
	"unit" text,
	"value_type" "spec_value_type" NOT NULL,
	"source_page_id" uuid NOT NULL,
	"verification_status" "verification_status" DEFAULT 'unverified' NOT NULL,
	"source_priority" integer DEFAULT 100 NOT NULL,
	"observed_at" timestamp with time zone NOT NULL,
	"verified_at" timestamp with time zone,
	"valid_from" timestamp with time zone,
	"valid_until" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "vehicle_model_specifications_single_value_check" CHECK ((
        ("value_type" = 'number' AND "numeric_value" IS NOT NULL AND "text_value" IS NULL AND "boolean_value" IS NULL) OR
        ("value_type" = 'text' AND "text_value" IS NOT NULL AND "numeric_value" IS NULL AND "boolean_value" IS NULL) OR
        ("value_type" = 'boolean' AND "boolean_value" IS NOT NULL AND "numeric_value" IS NULL AND "text_value" IS NULL)
      ))
);
--> statement-breakpoint
ALTER TABLE "vehicle_offers" ALTER COLUMN "variant_id" DROP NOT NULL;
--> statement-breakpoint
ALTER TABLE "vehicle_model_specifications" ADD CONSTRAINT "vehicle_model_specifications_model_id_vehicle_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."vehicle_models"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "vehicle_model_specifications" ADD CONSTRAINT "vehicle_model_specifications_source_page_id_source_pages_id_fk" FOREIGN KEY ("source_page_id") REFERENCES "public"."source_pages"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "vehicle_offers" ADD COLUMN "model_id" uuid;
--> statement-breakpoint
ALTER TABLE "vehicle_offers" ADD CONSTRAINT "vehicle_offers_model_id_vehicle_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."vehicle_models"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "vehicle_offers" ADD CONSTRAINT "vehicle_offers_exactly_one_subject_check" CHECK ((
        ("variant_id" IS NOT NULL AND "model_id" IS NULL) OR
        ("variant_id" IS NULL AND "model_id" IS NOT NULL)
      ));
--> statement-breakpoint
CREATE INDEX "vehicle_model_specifications_model_id_idx" ON "vehicle_model_specifications" USING btree ("model_id");
--> statement-breakpoint
CREATE INDEX "vehicle_model_specifications_field_key_idx" ON "vehicle_model_specifications" USING btree ("field_key");
--> statement-breakpoint
CREATE INDEX "vehicle_model_specifications_numeric_value_idx" ON "vehicle_model_specifications" USING btree ("numeric_value");
--> statement-breakpoint
CREATE INDEX "vehicle_model_specifications_verification_status_idx" ON "vehicle_model_specifications" USING btree ("verification_status");
--> statement-breakpoint
CREATE INDEX "vehicle_model_specifications_observed_at_idx" ON "vehicle_model_specifications" USING btree ("observed_at");
--> statement-breakpoint
CREATE UNIQUE INDEX "vehicle_model_specifications_model_field_source_unique" ON "vehicle_model_specifications" USING btree ("model_id","field_key","source_page_id");
--> statement-breakpoint
CREATE INDEX "vehicle_offers_model_id_idx" ON "vehicle_offers" USING btree ("model_id");
