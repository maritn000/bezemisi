import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { sources } from "./sources-table";

export const specValueTypeEnum = pgEnum("spec_value_type", [
  "number",
  "text",
  "boolean",
]);

export const verificationStatusEnum = pgEnum("verification_status", [
  "verified",
  "conflicting",
  "stale",
  "unverified",
  "rejected",
]);

export const offerAvailabilityEnum = pgEnum("offer_availability_status", [
  "available",
  "reserved",
  "sold",
  "on_order",
  "unknown",
]);

export const offerConditionEnum = pgEnum("offer_condition", [
  "new",
  "used",
  "demonstration",
  "unknown",
]);

export const sourcePageTypeEnum = pgEnum("source_page_type", [
  "bezemisi_vehicle_page",
  "bezemisi_offer_page",
  "bezemisi_commercial_page",
  "manufacturer_model_page",
  "manufacturer_specification",
  "manufacturer_price_list",
  "manufacturer_manual",
  "official_regulatory_source",
  "other_approved",
]);

export const sourceAuthorityEnum = pgEnum("source_authority", [
  "primary_bezemisi",
  "primary_manufacturer",
  "primary_regulatory",
  "secondary_approved",
]);

export const ingestionStatusEnum = pgEnum("ingestion_status", [
  "pending",
  "running",
  "completed",
  "completed_with_warnings",
  "failed",
]);

export const commercialConditionTypeEnum = pgEnum("commercial_condition_type", [
  "purchase_process",
  "financing",
  "operating_lease",
  "trade_in",
  "warranty",
  "delivery",
  "reservation",
  "deposit",
  "payment",
  "returns",
  "contact",
  "other",
]);

export const vehicleBrands = pgTable(
  "vehicle_brands",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    country: text("country"),
    websiteUrl: text("website_url"),
    logoAssetPath: text("logo_asset_path"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("vehicle_brands_slug_unique").on(table.slug),
    uniqueIndex("vehicle_brands_name_lower_unique").on(sql`lower(${table.name})`),
    index("vehicle_brands_is_active_idx").on(table.isActive),
  ],
);

export const vehicleModels = pgTable(
  "vehicle_models",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    brandId: uuid("brand_id")
      .notNull()
      .references(() => vehicleBrands.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    generationName: text("generation_name"),
    bodyType: text("body_type"),
    vehicleCategory: text("vehicle_category"),
    productionStartYear: integer("production_start_year"),
    productionEndYear: integer("production_end_year"),
    description: text("description"),
    mainImagePath: text("main_image_path"),
    isPresentedByBezemisi: boolean("is_presented_by_bezemisi")
      .notNull()
      .default(false),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("vehicle_models_brand_slug_generation_unique").on(
      table.brandId,
      table.slug,
      sql`coalesce(${table.generationName}, '')`,
    ),
    index("vehicle_models_brand_id_idx").on(table.brandId),
    index("vehicle_models_is_presented_idx").on(table.isPresentedByBezemisi),
    index("vehicle_models_is_active_idx").on(table.isActive),
  ],
);

export const vehicleVariants = pgTable(
  "vehicle_variants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    modelId: uuid("model_id")
      .notNull()
      .references(() => vehicleModels.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    modelYear: integer("model_year"),
    trimName: text("trim_name"),
    batteryVariant: text("battery_variant"),
    drivetrain: text("drivetrain"),
    market: text("market").notNull().default("CZ"),
    seats: integer("seats"),
    doors: integer("doors"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("vehicle_variants_model_slug_unique").on(
      table.modelId,
      table.slug,
      sql`coalesce(${table.modelYear}::text, '')`,
      sql`coalesce(${table.market}, '')`,
    ),
    index("vehicle_variants_model_id_idx").on(table.modelId),
    index("vehicle_variants_model_year_idx").on(table.modelYear),
    index("vehicle_variants_drivetrain_idx").on(table.drivetrain),
    index("vehicle_variants_is_active_idx").on(table.isActive),
  ],
);

export const sourcePages = pgTable(
  "source_pages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sourceId: uuid("source_id").references(() => sources.id, {
      onDelete: "set null",
    }),
    url: text("url").notNull(),
    canonicalUrl: text("canonical_url"),
    title: text("title").notNull(),
    publisher: text("publisher"),
    sourceType: sourcePageTypeEnum("source_type").notNull(),
    sourceAuthority: sourceAuthorityEnum("source_authority").notNull(),
    language: text("language").notNull().default("cs"),
    market: text("market").notNull().default("CZ"),
    httpStatus: integer("http_status"),
    contentHash: text("content_hash"),
    retrievedAt: timestamp("retrieved_at", { withTimezone: true }),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    lastModifiedAt: timestamp("last_modified_at", { withTimezone: true }),
    isCurrent: boolean("is_current").notNull().default(true),
    rawMetadata: jsonb("raw_metadata")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("source_pages_url_unique").on(table.url),
    uniqueIndex("source_pages_canonical_url_unique")
      .on(table.canonicalUrl)
      .where(sql`${table.canonicalUrl} is not null`),
    index("source_pages_source_type_idx").on(table.sourceType),
    index("source_pages_is_current_idx").on(table.isCurrent),
    index("source_pages_retrieved_at_idx").on(table.retrievedAt),
  ],
);

export const vehicleSpecifications = pgTable(
  "vehicle_specifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    variantId: uuid("variant_id")
      .notNull()
      .references(() => vehicleVariants.id, { onDelete: "cascade" }),
    fieldKey: text("field_key").notNull(),
    numericValue: numeric("numeric_value", { precision: 14, scale: 4 }),
    textValue: text("text_value"),
    booleanValue: boolean("boolean_value"),
    unit: text("unit"),
    valueType: specValueTypeEnum("value_type").notNull(),
    sourcePageId: uuid("source_page_id")
      .notNull()
      .references(() => sourcePages.id, { onDelete: "restrict" }),
    verificationStatus: verificationStatusEnum("verification_status")
      .notNull()
      .default("unverified"),
    sourcePriority: integer("source_priority").notNull().default(100),
    observedAt: timestamp("observed_at", { withTimezone: true }).notNull(),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    validFrom: timestamp("valid_from", { withTimezone: true }),
    validUntil: timestamp("valid_until", { withTimezone: true }),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("vehicle_specifications_variant_id_idx").on(table.variantId),
    index("vehicle_specifications_field_key_idx").on(table.fieldKey),
    index("vehicle_specifications_numeric_value_idx").on(table.numericValue),
    index("vehicle_specifications_verification_status_idx").on(
      table.verificationStatus,
    ),
    index("vehicle_specifications_observed_at_idx").on(table.observedAt),
    check(
      "vehicle_specifications_single_value_check",
      sql`(
        (${table.valueType} = 'number' AND ${table.numericValue} IS NOT NULL AND ${table.textValue} IS NULL AND ${table.booleanValue} IS NULL) OR
        (${table.valueType} = 'text' AND ${table.textValue} IS NOT NULL AND ${table.numericValue} IS NULL AND ${table.booleanValue} IS NULL) OR
        (${table.valueType} = 'boolean' AND ${table.booleanValue} IS NOT NULL AND ${table.numericValue} IS NULL AND ${table.textValue} IS NULL)
      )`,
    ),
  ],
);

export const vehicleOffers = pgTable(
  "vehicle_offers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    variantId: uuid("variant_id")
      .notNull()
      .references(() => vehicleVariants.id, { onDelete: "restrict" }),
    sourcePageId: uuid("source_page_id")
      .notNull()
      .references(() => sourcePages.id, { onDelete: "restrict" }),
    externalOfferId: text("external_offer_id"),
    title: text("title").notNull(),
    offerUrl: text("offer_url"),
    offerType: text("offer_type").notNull().default("list_price"),
    condition: offerConditionEnum("condition").notNull().default("new"),
    modelYear: integer("model_year"),
    registrationYear: integer("registration_year"),
    mileageKm: integer("mileage_km"),
    colour: text("colour"),
    vin: text("vin"),
    listPrice: numeric("list_price", { precision: 14, scale: 2 }),
    currentPrice: numeric("current_price", { precision: 14, scale: 2 }),
    currency: text("currency").notNull().default("CZK"),
    vatStatus: text("vat_status"),
    financingAvailable: boolean("financing_available"),
    operatingLeaseAvailable: boolean("operating_lease_available"),
    availabilityStatus: offerAvailabilityEnum("availability_status")
      .notNull()
      .default("unknown"),
    availabilityText: text("availability_text"),
    location: text("location"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    observedAt: timestamp("observed_at", { withTimezone: true }).notNull(),
    validUntil: timestamp("valid_until", { withTimezone: true }),
    isCurrent: boolean("is_current").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("vehicle_offers_offer_url_current_unique")
      .on(table.offerUrl)
      .where(sql`${table.offerUrl} is not null and ${table.isCurrent} = true`),
    uniqueIndex("vehicle_offers_external_offer_id_unique")
      .on(table.externalOfferId)
      .where(sql`${table.externalOfferId} is not null`),
    index("vehicle_offers_variant_id_idx").on(table.variantId),
    index("vehicle_offers_is_current_idx").on(table.isCurrent),
    index("vehicle_offers_availability_status_idx").on(table.availabilityStatus),
    index("vehicle_offers_current_price_idx").on(table.currentPrice),
  ],
);

export const commercialConditions = pgTable(
  "commercial_conditions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    conditionType: commercialConditionTypeEnum("condition_type").notNull(),
    title: text("title").notNull(),
    content: text("content").notNull(),
    structuredValue: jsonb("structured_value")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    unit: text("unit"),
    currency: text("currency"),
    sourcePageId: uuid("source_page_id")
      .notNull()
      .references(() => sourcePages.id, { onDelete: "restrict" }),
    verificationStatus: verificationStatusEnum("verification_status")
      .notNull()
      .default("unverified"),
    observedAt: timestamp("observed_at", { withTimezone: true }).notNull(),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    validFrom: timestamp("valid_from", { withTimezone: true }),
    validUntil: timestamp("valid_until", { withTimezone: true }),
    isCurrent: boolean("is_current").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("commercial_conditions_type_idx").on(table.conditionType),
    index("commercial_conditions_is_current_idx").on(table.isCurrent),
    index("commercial_conditions_verification_status_idx").on(
      table.verificationStatus,
    ),
  ],
);

export const catalogueIngestionRuns = pgTable(
  "catalogue_ingestion_runs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    runType: text("run_type").notNull(),
    status: ingestionStatusEnum("status").notNull().default("pending"),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    pagesDiscovered: integer("pages_discovered").notNull().default(0),
    pagesProcessed: integer("pages_processed").notNull().default(0),
    modelsCreated: integer("models_created").notNull().default(0),
    variantsCreated: integer("variants_created").notNull().default(0),
    factsCreated: integer("facts_created").notNull().default(0),
    factsUpdated: integer("facts_updated").notNull().default(0),
    offersCreated: integer("offers_created").notNull().default(0),
    offersUpdated: integer("offers_updated").notNull().default(0),
    warningsCount: integer("warnings_count").notNull().default(0),
    errorsCount: integer("errors_count").notNull().default(0),
    metadata: jsonb("metadata")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("catalogue_ingestion_runs_status_idx").on(table.status),
    index("catalogue_ingestion_runs_started_at_idx").on(table.startedAt),
  ],
);

export const catalogueIngestionIssues = pgTable(
  "catalogue_ingestion_issues",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ingestionRunId: uuid("ingestion_run_id")
      .notNull()
      .references(() => catalogueIngestionRuns.id, { onDelete: "cascade" }),
    sourcePageId: uuid("source_page_id").references(() => sourcePages.id, {
      onDelete: "set null",
    }),
    entityType: text("entity_type").notNull(),
    entityIdentifier: text("entity_identifier"),
    fieldKey: text("field_key"),
    issueType: text("issue_type").notNull(),
    severity: text("severity").notNull().default("warning"),
    message: text("message").notNull(),
    metadata: jsonb("metadata")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("catalogue_ingestion_issues_run_id_idx").on(table.ingestionRunId),
    index("catalogue_ingestion_issues_issue_type_idx").on(table.issueType),
    index("catalogue_ingestion_issues_severity_idx").on(table.severity),
  ],
);
