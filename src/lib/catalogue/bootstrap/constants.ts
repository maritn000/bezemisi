export const FOUNDATION_TABLES = [
  "app_health_checks",
  "sources",
  "conversations",
  "messages",
] as const;

export const CATALOGUE_TABLES = [
  "vehicle_brands",
  "vehicle_models",
  "vehicle_variants",
  "vehicle_specifications",
  "vehicle_model_specifications",
  "vehicle_offers",
  "commercial_conditions",
  "source_pages",
  "catalogue_ingestion_runs",
  "catalogue_ingestion_issues",
] as const;

export const ALL_BEZEMISI_TABLES = [
  ...FOUNDATION_TABLES,
  ...CATALOGUE_TABLES,
] as const;

export const POSTGRES_SYSTEM_SCHEMAS = [
  "information_schema",
  "pg_catalog",
  "pg_toast",
] as const;

export const IGNORED_APPLICATION_SCHEMAS = ["drizzle"] as const;

export const EXPECTED_MIGRATION_TAGS = [
  "0000_redundant_wild_pack",
  "0001_woozy_expediter",
  "0002_model_level_specs",
] as const;

export const BLOCKED_DATABASE_IDENTIFIERS = [
  "mysecondapp",
  "my_second_app",
] as const;

export const CATALOGUE_MIGRATION_TAG = "0002_model_level_specs";

export const MINIMUM_BOOTSTRAP_COUNTS = {
  brands: 3,
  models: 3,
  variants: 3,
  sourcePages: 1,
  verifiedFacts: 1,
  completedIngestionRuns: 1,
} as const;
