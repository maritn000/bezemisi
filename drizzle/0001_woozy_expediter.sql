CREATE TYPE "public"."commercial_condition_type" AS ENUM('purchase_process', 'financing', 'operating_lease', 'trade_in', 'warranty', 'delivery', 'reservation', 'deposit', 'payment', 'returns', 'contact', 'other');--> statement-breakpoint
CREATE TYPE "public"."ingestion_status" AS ENUM('pending', 'running', 'completed', 'completed_with_warnings', 'failed');--> statement-breakpoint
CREATE TYPE "public"."offer_availability_status" AS ENUM('available', 'reserved', 'sold', 'on_order', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."offer_condition" AS ENUM('new', 'used', 'demonstration', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."source_authority" AS ENUM('primary_bezemisi', 'primary_manufacturer', 'primary_regulatory', 'secondary_approved');--> statement-breakpoint
CREATE TYPE "public"."source_page_type" AS ENUM('bezemisi_vehicle_page', 'bezemisi_offer_page', 'bezemisi_commercial_page', 'manufacturer_model_page', 'manufacturer_specification', 'manufacturer_price_list', 'manufacturer_manual', 'official_regulatory_source', 'other_approved');--> statement-breakpoint
CREATE TYPE "public"."spec_value_type" AS ENUM('number', 'text', 'boolean');--> statement-breakpoint
CREATE TYPE "public"."verification_status" AS ENUM('verified', 'conflicting', 'stale', 'unverified', 'rejected');--> statement-breakpoint
CREATE TABLE "catalogue_ingestion_issues" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ingestion_run_id" uuid NOT NULL,
	"source_page_id" uuid,
	"entity_type" text NOT NULL,
	"entity_identifier" text,
	"field_key" text,
	"issue_type" text NOT NULL,
	"severity" text DEFAULT 'warning' NOT NULL,
	"message" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "catalogue_ingestion_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"run_type" text NOT NULL,
	"status" "ingestion_status" DEFAULT 'pending' NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"pages_discovered" integer DEFAULT 0 NOT NULL,
	"pages_processed" integer DEFAULT 0 NOT NULL,
	"models_created" integer DEFAULT 0 NOT NULL,
	"variants_created" integer DEFAULT 0 NOT NULL,
	"facts_created" integer DEFAULT 0 NOT NULL,
	"facts_updated" integer DEFAULT 0 NOT NULL,
	"offers_created" integer DEFAULT 0 NOT NULL,
	"offers_updated" integer DEFAULT 0 NOT NULL,
	"warnings_count" integer DEFAULT 0 NOT NULL,
	"errors_count" integer DEFAULT 0 NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "commercial_conditions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"condition_type" "commercial_condition_type" NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"structured_value" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"unit" text,
	"currency" text,
	"source_page_id" uuid NOT NULL,
	"verification_status" "verification_status" DEFAULT 'unverified' NOT NULL,
	"observed_at" timestamp with time zone NOT NULL,
	"verified_at" timestamp with time zone,
	"valid_from" timestamp with time zone,
	"valid_until" timestamp with time zone,
	"is_current" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "source_pages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_id" uuid,
	"url" text NOT NULL,
	"canonical_url" text,
	"title" text NOT NULL,
	"publisher" text,
	"source_type" "source_page_type" NOT NULL,
	"source_authority" "source_authority" NOT NULL,
	"language" text DEFAULT 'cs' NOT NULL,
	"market" text DEFAULT 'CZ' NOT NULL,
	"http_status" integer,
	"content_hash" text,
	"retrieved_at" timestamp with time zone,
	"published_at" timestamp with time zone,
	"last_modified_at" timestamp with time zone,
	"is_current" boolean DEFAULT true NOT NULL,
	"raw_metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vehicle_brands" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"country" text,
	"website_url" text,
	"logo_asset_path" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vehicle_models" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"generation_name" text,
	"body_type" text,
	"vehicle_category" text,
	"production_start_year" integer,
	"production_end_year" integer,
	"description" text,
	"main_image_path" text,
	"is_presented_by_bezemisi" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vehicle_offers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"variant_id" uuid NOT NULL,
	"source_page_id" uuid NOT NULL,
	"external_offer_id" text,
	"title" text NOT NULL,
	"offer_url" text,
	"offer_type" text DEFAULT 'list_price' NOT NULL,
	"condition" "offer_condition" DEFAULT 'new' NOT NULL,
	"model_year" integer,
	"registration_year" integer,
	"mileage_km" integer,
	"colour" text,
	"vin" text,
	"list_price" numeric(14, 2),
	"current_price" numeric(14, 2),
	"currency" text DEFAULT 'CZK' NOT NULL,
	"vat_status" text,
	"financing_available" boolean,
	"operating_lease_available" boolean,
	"availability_status" "offer_availability_status" DEFAULT 'unknown' NOT NULL,
	"availability_text" text,
	"location" text,
	"published_at" timestamp with time zone,
	"observed_at" timestamp with time zone NOT NULL,
	"valid_until" timestamp with time zone,
	"is_current" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vehicle_specifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"variant_id" uuid NOT NULL,
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
	CONSTRAINT "vehicle_specifications_single_value_check" CHECK ((
        ("vehicle_specifications"."value_type" = 'number' AND "vehicle_specifications"."numeric_value" IS NOT NULL AND "vehicle_specifications"."text_value" IS NULL AND "vehicle_specifications"."boolean_value" IS NULL) OR
        ("vehicle_specifications"."value_type" = 'text' AND "vehicle_specifications"."text_value" IS NOT NULL AND "vehicle_specifications"."numeric_value" IS NULL AND "vehicle_specifications"."boolean_value" IS NULL) OR
        ("vehicle_specifications"."value_type" = 'boolean' AND "vehicle_specifications"."boolean_value" IS NOT NULL AND "vehicle_specifications"."numeric_value" IS NULL AND "vehicle_specifications"."text_value" IS NULL)
      ))
);
--> statement-breakpoint
CREATE TABLE "vehicle_variants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"model_id" uuid NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"model_year" integer,
	"trim_name" text,
	"battery_variant" text,
	"drivetrain" text,
	"market" text DEFAULT 'CZ' NOT NULL,
	"seats" integer,
	"doors" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "catalogue_ingestion_issues" ADD CONSTRAINT "catalogue_ingestion_issues_ingestion_run_id_catalogue_ingestion_runs_id_fk" FOREIGN KEY ("ingestion_run_id") REFERENCES "public"."catalogue_ingestion_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "catalogue_ingestion_issues" ADD CONSTRAINT "catalogue_ingestion_issues_source_page_id_source_pages_id_fk" FOREIGN KEY ("source_page_id") REFERENCES "public"."source_pages"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commercial_conditions" ADD CONSTRAINT "commercial_conditions_source_page_id_source_pages_id_fk" FOREIGN KEY ("source_page_id") REFERENCES "public"."source_pages"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_pages" ADD CONSTRAINT "source_pages_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_models" ADD CONSTRAINT "vehicle_models_brand_id_vehicle_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."vehicle_brands"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_offers" ADD CONSTRAINT "vehicle_offers_variant_id_vehicle_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."vehicle_variants"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_offers" ADD CONSTRAINT "vehicle_offers_source_page_id_source_pages_id_fk" FOREIGN KEY ("source_page_id") REFERENCES "public"."source_pages"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_specifications" ADD CONSTRAINT "vehicle_specifications_variant_id_vehicle_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."vehicle_variants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_specifications" ADD CONSTRAINT "vehicle_specifications_source_page_id_source_pages_id_fk" FOREIGN KEY ("source_page_id") REFERENCES "public"."source_pages"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_variants" ADD CONSTRAINT "vehicle_variants_model_id_vehicle_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."vehicle_models"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "catalogue_ingestion_issues_run_id_idx" ON "catalogue_ingestion_issues" USING btree ("ingestion_run_id");--> statement-breakpoint
CREATE INDEX "catalogue_ingestion_issues_issue_type_idx" ON "catalogue_ingestion_issues" USING btree ("issue_type");--> statement-breakpoint
CREATE INDEX "catalogue_ingestion_issues_severity_idx" ON "catalogue_ingestion_issues" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "catalogue_ingestion_runs_status_idx" ON "catalogue_ingestion_runs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "catalogue_ingestion_runs_started_at_idx" ON "catalogue_ingestion_runs" USING btree ("started_at");--> statement-breakpoint
CREATE INDEX "commercial_conditions_type_idx" ON "commercial_conditions" USING btree ("condition_type");--> statement-breakpoint
CREATE INDEX "commercial_conditions_is_current_idx" ON "commercial_conditions" USING btree ("is_current");--> statement-breakpoint
CREATE INDEX "commercial_conditions_verification_status_idx" ON "commercial_conditions" USING btree ("verification_status");--> statement-breakpoint
CREATE UNIQUE INDEX "source_pages_url_unique" ON "source_pages" USING btree ("url");--> statement-breakpoint
CREATE UNIQUE INDEX "source_pages_canonical_url_unique" ON "source_pages" USING btree ("canonical_url") WHERE "source_pages"."canonical_url" is not null;--> statement-breakpoint
CREATE INDEX "source_pages_source_type_idx" ON "source_pages" USING btree ("source_type");--> statement-breakpoint
CREATE INDEX "source_pages_is_current_idx" ON "source_pages" USING btree ("is_current");--> statement-breakpoint
CREATE INDEX "source_pages_retrieved_at_idx" ON "source_pages" USING btree ("retrieved_at");--> statement-breakpoint
CREATE UNIQUE INDEX "vehicle_brands_slug_unique" ON "vehicle_brands" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "vehicle_brands_name_lower_unique" ON "vehicle_brands" USING btree (lower("name"));--> statement-breakpoint
CREATE INDEX "vehicle_brands_is_active_idx" ON "vehicle_brands" USING btree ("is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "vehicle_models_brand_slug_generation_unique" ON "vehicle_models" USING btree ("brand_id","slug",coalesce("generation_name", ''));--> statement-breakpoint
CREATE INDEX "vehicle_models_brand_id_idx" ON "vehicle_models" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX "vehicle_models_is_presented_idx" ON "vehicle_models" USING btree ("is_presented_by_bezemisi");--> statement-breakpoint
CREATE INDEX "vehicle_models_is_active_idx" ON "vehicle_models" USING btree ("is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "vehicle_offers_offer_url_current_unique" ON "vehicle_offers" USING btree ("offer_url") WHERE "vehicle_offers"."offer_url" is not null and "vehicle_offers"."is_current" = true;--> statement-breakpoint
CREATE UNIQUE INDEX "vehicle_offers_external_offer_id_unique" ON "vehicle_offers" USING btree ("external_offer_id") WHERE "vehicle_offers"."external_offer_id" is not null;--> statement-breakpoint
CREATE INDEX "vehicle_offers_variant_id_idx" ON "vehicle_offers" USING btree ("variant_id");--> statement-breakpoint
CREATE INDEX "vehicle_offers_is_current_idx" ON "vehicle_offers" USING btree ("is_current");--> statement-breakpoint
CREATE INDEX "vehicle_offers_availability_status_idx" ON "vehicle_offers" USING btree ("availability_status");--> statement-breakpoint
CREATE INDEX "vehicle_offers_current_price_idx" ON "vehicle_offers" USING btree ("current_price");--> statement-breakpoint
CREATE INDEX "vehicle_specifications_variant_id_idx" ON "vehicle_specifications" USING btree ("variant_id");--> statement-breakpoint
CREATE INDEX "vehicle_specifications_field_key_idx" ON "vehicle_specifications" USING btree ("field_key");--> statement-breakpoint
CREATE INDEX "vehicle_specifications_numeric_value_idx" ON "vehicle_specifications" USING btree ("numeric_value");--> statement-breakpoint
CREATE INDEX "vehicle_specifications_verification_status_idx" ON "vehicle_specifications" USING btree ("verification_status");--> statement-breakpoint
CREATE INDEX "vehicle_specifications_observed_at_idx" ON "vehicle_specifications" USING btree ("observed_at");--> statement-breakpoint
CREATE UNIQUE INDEX "vehicle_variants_model_slug_unique" ON "vehicle_variants" USING btree ("model_id","slug",coalesce("model_year"::text, ''),coalesce("market", ''));--> statement-breakpoint
CREATE INDEX "vehicle_variants_model_id_idx" ON "vehicle_variants" USING btree ("model_id");--> statement-breakpoint
CREATE INDEX "vehicle_variants_model_year_idx" ON "vehicle_variants" USING btree ("model_year");--> statement-breakpoint
CREATE INDEX "vehicle_variants_drivetrain_idx" ON "vehicle_variants" USING btree ("drivetrain");--> statement-breakpoint
CREATE INDEX "vehicle_variants_is_active_idx" ON "vehicle_variants" USING btree ("is_active");