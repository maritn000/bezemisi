import { countCatalogueStats } from "@/lib/catalogue/repositories/catalogue-repository";
import { runIngestion } from "@/lib/catalogue/ingestion/run-ingestion";
import { validateCatalogue } from "@/lib/catalogue/validation";

import { isCatalogueBootstrapEnabled } from "./flags";
import { runDatabaseTargetPreflight } from "./preflight";
import {
  formatMigrationTagForLog,
  inspectCurrentSchema,
  runPendingCatalogueMigrations,
  verifyCatalogueSchema,
} from "./schema";
import {
  getLatestIngestionRun,
  verifyBootstrapRowCounts,
  type BootstrapCountVerification,
} from "./verify-counts";

export type BootstrapStage =
  | "disabled"
  | "preflight"
  | "schema_inspection"
  | "migration"
  | "schema_verification"
  | "ingestion"
  | "validation"
  | "report"
  | "row_count_verification"
  | "completed";

export type BootstrapReport = {
  enabled: boolean;
  success: boolean;
  stage: BootstrapStage;
  database?: {
    sourceKey: string;
    host: string;
    database: string;
  };
  schemaBefore?: Awaited<ReturnType<typeof inspectCurrentSchema>>;
  schemaAfter?: Awaited<ReturnType<typeof verifyCatalogueSchema>>;
  ingestion?: Awaited<ReturnType<typeof runIngestion>>;
  validation?: Awaited<ReturnType<typeof validateCatalogue>>;
  counts?: BootstrapCountVerification;
  warnings: string[];
  errors: string[];
};

export type BootstrapDependencies = {
  isEnabled: () => boolean;
  preflight: typeof runDatabaseTargetPreflight;
  inspectSchema: typeof inspectCurrentSchema;
  migrate: typeof runPendingCatalogueMigrations;
  verifySchema: typeof verifyCatalogueSchema;
  ingest: (options?: { dryRun?: boolean }) => Promise<Awaited<ReturnType<typeof runIngestion>>>;
  validate: typeof validateCatalogue;
  countStats: typeof countCatalogueStats;
  verifyCounts: typeof verifyBootstrapRowCounts;
  getLatestRun: (
    databaseUrl: string,
  ) => Promise<Awaited<ReturnType<typeof getLatestIngestionRun>>>;
};

const defaultDependencies: BootstrapDependencies = {
  isEnabled: isCatalogueBootstrapEnabled,
  preflight: runDatabaseTargetPreflight,
  inspectSchema: inspectCurrentSchema,
  migrate: runPendingCatalogueMigrations,
  verifySchema: verifyCatalogueSchema,
  ingest: runIngestion,
  validate: validateCatalogue,
  countStats: countCatalogueStats,
  verifyCounts: verifyBootstrapRowCounts,
  getLatestRun: getLatestIngestionRun,
};

function safeLog(message: string, details?: Record<string, unknown>) {
  if (details) {
    console.log(message, JSON.stringify(details));
    return;
  }
  console.log(message);
}

export async function runCatalogueBootstrap(
  deps: BootstrapDependencies = defaultDependencies,
): Promise<BootstrapReport> {
  const report: BootstrapReport = {
    enabled: deps.isEnabled(),
    success: false,
    stage: "disabled",
    warnings: [],
    errors: [],
  };

  if (!report.enabled) {
    safeLog("Catalogue bootstrap skipped: RUN_CATALOGUE_BOOTSTRAP is not true.");
    report.success = true;
    return report;
  }

  report.stage = "preflight";
  safeLog("Catalogue bootstrap stage: database target preflight");

  const preflight = await deps.preflight();
  if (!preflight.ok) {
    report.errors.push(preflight.reason);
    return report;
  }

  report.database = {
    sourceKey: preflight.sourceKey,
    host: preflight.redacted.host,
    database: preflight.redacted.database,
  };

  safeLog("Catalogue bootstrap target confirmed", report.database);

  report.stage = "schema_inspection";
  safeLog("Catalogue bootstrap stage: current schema inspection");

  const schemaBefore = await deps.inspectSchema(preflight.resolved.url);
  report.schemaBefore = schemaBefore;
  safeLog("Catalogue bootstrap schema inspection", {
    catalogueTablesPresent: schemaBefore.catalogueTablesPresent,
    appliedMigrations: schemaBefore.appliedMigrations.length,
    migrationTag: formatMigrationTagForLog(),
  });

  report.stage = "migration";
  safeLog("Catalogue bootstrap stage: catalogue migration");

  try {
    await deps.migrate(preflight.resolved.url);
  } catch (error) {
    report.errors.push(
      error instanceof Error
        ? `Migration failed: ${error.message}`
        : "Migration failed with an unknown error.",
    );
    return report;
  }

  report.stage = "schema_verification";
  safeLog("Catalogue bootstrap stage: schema verification");

  const schemaAfter = await deps.verifySchema(preflight.resolved.url);
  report.schemaAfter = schemaAfter;

  if (!schemaAfter.ok) {
    report.errors.push(
      `Catalogue schema verification failed. Missing tables: ${schemaAfter.missingTables.join(", ")}`,
    );
    return report;
  }

  report.stage = "ingestion";
  safeLog("Catalogue bootstrap stage: catalogue ingestion");

  let ingestion: Awaited<ReturnType<typeof runIngestion>>;
  try {
    ingestion = await deps.ingest();
  } catch (error) {
    report.errors.push(
      error instanceof Error
        ? `Ingestion failed: ${error.message}`
        : "Ingestion failed with an unknown error.",
    );
    return report;
  }

  report.ingestion = ingestion;
  safeLog("Catalogue bootstrap ingestion summary", {
    runId: ingestion.runId,
    pagesProcessed: ingestion.pagesProcessed,
    variantsCreated: ingestion.variantsCreated,
    factsCreated: ingestion.factsCreated,
    warningsCount: ingestion.warningsCount,
    errorsCount: ingestion.errorsCount,
  });

  report.stage = "validation";
  safeLog("Catalogue bootstrap stage: catalogue validation");

  const validation = await deps.validate();
  report.validation = validation;

  for (const issue of validation.issues) {
    if (issue.severity === "warning") {
      report.warnings.push(`${issue.code}: ${issue.message}`);
    }
  }

  const criticalIssues = validation.issues.filter(
    (issue) => issue.severity === "error",
  );
  if (criticalIssues.length > 0) {
    report.errors.push(
      ...criticalIssues.map((issue) => `${issue.code}: ${issue.message}`),
    );
    return report;
  }

  report.stage = "report";
  safeLog("Catalogue bootstrap stage: catalogue report");

  const stats = await deps.countStats();
  const latestRun = await deps.getLatestRun(preflight.resolved.url);

  safeLog("Catalogue bootstrap report", {
    stats,
    lastIngestionStatus: latestRun?.status ?? null,
    lastIngestionAt: latestRun?.completedAt?.toISOString() ?? null,
    validationWarnings: report.warnings.length,
    validationErrors: report.errors.length,
  });

  report.stage = "row_count_verification";
  safeLog("Catalogue bootstrap stage: final database row-count verification");

  const counts = await deps.verifyCounts(preflight.resolved.url, stats);
  report.counts = counts;

  safeLog("Catalogue bootstrap row counts", {
    brands: counts.stats.brands,
    models: counts.stats.models,
    variants: counts.stats.variants,
    sourcePages: counts.stats.sourcePages,
    verifiedFacts: counts.stats.verifiedFacts,
    completedIngestionRuns: counts.completedIngestionRuns,
  });

  if (!counts.ok) {
    report.errors.push(...counts.failures);
    return report;
  }

  report.stage = "completed";
  report.success = true;
  safeLog("Catalogue bootstrap completed successfully.");
  return report;
}
