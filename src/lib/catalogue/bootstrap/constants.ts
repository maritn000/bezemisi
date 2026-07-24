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
  "vehicle_offers",
  "commercial_conditions",
  "source_pages",
  "catalogue_ingestion_runs",
  "catalogue_ingestion_issues",
] as const;

export const BLOCKED_DATABASE_IDENTIFIERS = [
  "mysecondapp",
  "my_second_app",
] as const;

export const CATALOGUE_MIGRATION_TAG = "0001_woozy_expediter";

export const MINIMUM_BOOTSTRAP_COUNTS = {
  brands: 3,
  models: 3,
  variants: 3,
  sourcePages: 1,
  verifiedFacts: 1,
  completedIngestionRuns: 1,
} as const;
