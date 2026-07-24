import assert from "node:assert/strict";
import test from "node:test";

import { classifyDatabaseSchema } from "@/lib/catalogue/bootstrap/classify-database";
import { isCatalogueBootstrapEnabled } from "@/lib/catalogue/bootstrap/flags";
import { runDatabaseTargetPreflight } from "@/lib/catalogue/bootstrap/preflight";
import {
  runCatalogueBootstrap,
  type BootstrapDependencies,
} from "@/lib/catalogue/bootstrap/run-bootstrap";
import { verifyBootstrapMinimumCounts } from "@/lib/catalogue/bootstrap/verify-counts";
import {
  getCataloguePublicStatus,
  getCatalogueStatusSnapshot,
} from "@/lib/catalogue/catalogue-health";

const emptyStats = {
  brands: 0,
  models: 0,
  variants: 0,
  verifiedFacts: 0,
  conflictingFacts: 0,
  currentOffers: 0,
  commercialConditions: 0,
  sourcePages: 0,
};

const successfulIngestion = {
  runId: "run",
  dryRun: false,
  pagesDiscovered: 25,
  pagesProcessed: 23,
  modelsCreated: 23,
  variantsCreated: 7,
  factsCreated: 40,
  factsUpdated: 0,
  offersCreated: 3,
  offersUpdated: 0,
  warningsCount: 16,
  errorsCount: 0,
  discoveredUrls: [] as string[],
};

function createDeps(
  overrides: Partial<BootstrapDependencies> = {},
): BootstrapDependencies {
  return {
    isEnabled: () => true,
    preflight: async () => ({
      ok: true,
      resolved: {
        url: "postgresql://user:pass@localhost:5432/bezemisi",
        sourceKey: "DATABASE_URL",
      },
      redacted: { host: "localhost", database: "bezemisi", user: "***" },
      sourceKey: "DATABASE_URL",
      classification: "existing_bezemisi_database",
      existingTables: [
        "app_health_checks",
        "sources",
        "conversations",
        "messages",
      ],
    }),
    inspectSchema: async () => ({
      existingTables: [
        "app_health_checks",
        "sources",
        "conversations",
        "messages",
      ],
      foundationTablesPresent: true,
      catalogueTablesPresent: true,
      appliedMigrations: [
        { id: 1, hash: "0000", createdAt: "2026-01-01T00:00:00.000Z" },
        { id: 2, hash: "0001", createdAt: "2026-01-01T00:00:01.000Z" },
      ],
      catalogueMigrationApplied: true,
      pendingMigrationTags: [],
    }),
    migrate: async () => {},
    verifyFoundation: async () => ({ ok: true, missingTables: [] }),
    verifySchema: async () => ({ ok: true, missingTables: [] }),
    ingest: async () => successfulIngestion,
    validate: async () => ({
      valid: true,
      issues: [],
      stats: {
        brands: 12,
        models: 23,
        variants: 7,
        verifiedFacts: 40,
        conflictingFacts: 0,
        currentOffers: 3,
        commercialConditions: 1,
        sourcePages: 24,
      },
    }),
    countStats: async () => ({
      brands: 12,
      models: 23,
      variants: 7,
      verifiedFacts: 40,
      conflictingFacts: 0,
      currentOffers: 3,
      commercialConditions: 1,
      sourcePages: 24,
    }),
    verifyCounts: async () => ({
      ok: true,
      stats: {
        brands: 12,
        models: 23,
        variants: 7,
        verifiedFacts: 40,
        conflictingFacts: 0,
        currentOffers: 3,
        commercialConditions: 1,
        sourcePages: 24,
      },
      completedIngestionRuns: 1,
      failures: [],
    }),
    getLatestRun: async () => ({
      id: "run",
      runType: "full",
      status: "completed_with_warnings",
      startedAt: new Date(),
      completedAt: new Date(),
      pagesDiscovered: 25,
      pagesProcessed: 23,
      modelsCreated: 23,
      variantsCreated: 7,
      factsCreated: 40,
      factsUpdated: 0,
      offersCreated: 3,
      offersUpdated: 0,
      warningsCount: 16,
      errorsCount: 0,
      discoveredUrls: [],
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
    ...overrides,
  };
}

test("bootstrap is disabled by default", async () => {
  assert.equal(isCatalogueBootstrapEnabled(undefined), false);
  assert.equal(isCatalogueBootstrapEnabled(""), false);
  assert.equal(isCatalogueBootstrapEnabled("false"), false);
  assert.equal(isCatalogueBootstrapEnabled("TRUE"), false);

  const report = await runCatalogueBootstrap(
    createDeps({
      isEnabled: () => false,
      preflight: async () => ({ ok: false, reason: "should not run" }),
      inspectSchema: async () => {
        throw new Error("should not run");
      },
      migrate: async () => {
        throw new Error("should not run");
      },
      ingest: async () => {
        throw new Error("should not run");
      },
    }),
  );

  assert.equal(report.enabled, false);
  assert.equal(report.success, true);
  assert.equal(report.stage, "disabled");
});

test("bootstrap runs only with the exact RUN_CATALOGUE_BOOTSTRAP=true flag", () => {
  assert.equal(isCatalogueBootstrapEnabled("true"), true);
});

test("unrelated non-empty database aborts before writes", async () => {
  let migrateCalled = false;
  let ingestCalled = false;

  const report = await runCatalogueBootstrap(
    createDeps({
      preflight: async () => ({
        ok: false,
        classification: "unrelated_nonempty_database",
        reason:
          'Refusing to bootstrap an unrelated database (unexpected tables: users, orders).',
      }),
      inspectSchema: async () => {
        throw new Error("should not run");
      },
      migrate: async () => {
        migrateCalled = true;
      },
      ingest: async () => {
        ingestCalled = true;
        return successfulIngestion;
      },
    }),
  );

  assert.equal(report.success, false);
  assert.equal(report.stage, "preflight");
  assert.equal(report.classification, "unrelated_nonempty_database");
  assert.equal(migrateCalled, false);
  assert.equal(ingestCalled, false);
});

test("empty database is classified as empty and can reach ingestion", async () => {
  let migrateCalled = false;
  let ingestCalled = false;

  const report = await runCatalogueBootstrap(
    createDeps({
      preflight: async () => ({
        ok: true,
        resolved: {
          url: "postgresql://user:pass@localhost:5432/bezemisi",
          sourceKey: "DATABASE_URL",
        },
        redacted: { host: "localhost", database: "bezemisi", user: "***" },
        sourceKey: "DATABASE_URL",
        classification: "empty_database",
        existingTables: [],
      }),
      inspectSchema: async () => ({
        existingTables: [],
        foundationTablesPresent: false,
        catalogueTablesPresent: false,
        appliedMigrations: [],
        catalogueMigrationApplied: false,
        pendingMigrationTags: [
          "0000_redundant_wild_pack",
          "0001_woozy_expediter",
        ],
      }),
      migrate: async () => {
        migrateCalled = true;
      },
      ingest: async () => {
        ingestCalled = true;
        return successfulIngestion;
      },
    }),
  );

  assert.equal(report.success, true);
  assert.equal(report.classification, "empty_database");
  assert.equal(migrateCalled, true);
  assert.equal(ingestCalled, true);
  assert.equal(report.stage, "completed");
});

test("existing Bez emisí database receives pending migrations only once", async () => {
  let migrateCalls = 0;

  const report = await runCatalogueBootstrap(
    createDeps({
      inspectSchema: async () => ({
        existingTables: [
          "app_health_checks",
          "sources",
          "conversations",
          "messages",
        ],
        foundationTablesPresent: true,
        catalogueTablesPresent: false,
        appliedMigrations: [
          { id: 1, hash: "0000", createdAt: "2026-01-01T00:00:00.000Z" },
        ],
        catalogueMigrationApplied: false,
        pendingMigrationTags: ["0001_woozy_expediter"],
      }),
      migrate: async () => {
        migrateCalls += 1;
      },
    }),
  );

  assert.equal(report.success, true);
  assert.equal(migrateCalls, 1);
  assert.equal(report.classification, "existing_bezemisi_database");
});

test("migration failure prevents ingestion", async () => {
  let ingestCalled = false;

  const report = await runCatalogueBootstrap(
    createDeps({
      inspectSchema: async () => ({
        existingTables: [],
        foundationTablesPresent: false,
        catalogueTablesPresent: false,
        appliedMigrations: [],
        catalogueMigrationApplied: false,
        pendingMigrationTags: [
          "0000_redundant_wild_pack",
          "0001_woozy_expediter",
        ],
      }),
      migrate: async () => {
        throw new Error("migration failed");
      },
      ingest: async () => {
        ingestCalled = true;
        return successfulIngestion;
      },
    }),
  );

  assert.equal(report.success, false);
  assert.equal(report.stage, "migration");
  assert.equal(ingestCalled, false);
});

test("missing foundation table after migration prevents ingestion", async () => {
  let ingestCalled = false;

  const report = await runCatalogueBootstrap(
    createDeps({
      verifyFoundation: async () => ({
        ok: false,
        missingTables: ["messages"],
      }),
      ingest: async () => {
        ingestCalled = true;
        return successfulIngestion;
      },
    }),
  );

  assert.equal(report.success, false);
  assert.equal(report.stage, "foundation_schema_verification");
  assert.match(report.errors[0], /messages/);
  assert.equal(ingestCalled, false);
});

test("empty ingestion fails verification", async () => {
  const report = await runCatalogueBootstrap(
    createDeps({
      ingest: async () => ({
        runId: "run",
        dryRun: false,
        pagesDiscovered: 0,
        pagesProcessed: 0,
        modelsCreated: 0,
        variantsCreated: 0,
        factsCreated: 0,
        factsUpdated: 0,
        offersCreated: 0,
        offersUpdated: 0,
        warningsCount: 0,
        errorsCount: 0,
        discoveredUrls: [],
      }),
      validate: async () => ({
        valid: true,
        issues: [],
        stats: emptyStats,
      }),
      countStats: async () => emptyStats,
      verifyCounts: async () => ({
        ok: false,
        stats: emptyStats,
        completedIngestionRuns: 0,
        failures: ["All catalogue tables are empty after ingestion."],
      }),
      getLatestRun: async () => null,
    }),
  );

  assert.equal(report.success, false);
  assert.equal(report.stage, "row_count_verification");
  assert.ok(report.errors.some((error) => error.includes("empty")));
});

test("successful ingestion returns real row counts", async () => {
  const report = await runCatalogueBootstrap(
    createDeps({
      validate: async () => ({
        valid: true,
        issues: [
          {
            severity: "warning",
            code: "low_model_count",
            message: "warning only",
          },
        ],
        stats: {
          brands: 12,
          models: 23,
          variants: 7,
          verifiedFacts: 40,
          conflictingFacts: 0,
          currentOffers: 3,
          commercialConditions: 1,
          sourcePages: 24,
        },
      }),
    }),
  );

  assert.equal(report.success, true);
  assert.equal(report.counts?.stats.brands, 12);
  assert.equal(report.counts?.stats.verifiedFacts, 40);
  assert.equal(report.warnings.length, 1);
});

test("rerunning ingestion does not create duplicates when counts stay stable", () => {
  const first = verifyBootstrapMinimumCounts({
    stats: {
      brands: 12,
      models: 23,
      variants: 7,
      verifiedFacts: 40,
      conflictingFacts: 0,
      currentOffers: 3,
      commercialConditions: 1,
      sourcePages: 24,
    },
    completedIngestionRuns: 1,
  });
  const second = verifyBootstrapMinimumCounts({
    stats: {
      brands: 12,
      models: 23,
      variants: 7,
      verifiedFacts: 40,
      conflictingFacts: 0,
      currentOffers: 3,
      commercialConditions: 1,
      sourcePages: 24,
    },
    completedIngestionRuns: 2,
  });

  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  assert.equal(first.stats.brands, second.stats.brands);
});

test("bootstrap rerun remains idempotent when schema is already complete", async () => {
  let migrateCalls = 0;

  const report = await runCatalogueBootstrap(
    createDeps({
      migrate: async () => {
        migrateCalls += 1;
      },
    }),
  );

  assert.equal(report.success, true);
  assert.equal(migrateCalls, 1);
});

test("validation critical errors fail bootstrap", async () => {
  const report = await runCatalogueBootstrap(
    createDeps({
      ingest: async () => ({
        runId: "run",
        dryRun: false,
        pagesDiscovered: 0,
        pagesProcessed: 0,
        modelsCreated: 0,
        variantsCreated: 0,
        factsCreated: 0,
        factsUpdated: 0,
        offersCreated: 0,
        offersUpdated: 0,
        warningsCount: 0,
        errorsCount: 0,
        discoveredUrls: [],
      }),
      validate: async () => ({
        valid: false,
        issues: [
          {
            severity: "error",
            code: "low_variant_count",
            message: "Nalezeno pouze 0 variant.",
          },
        ],
        stats: emptyStats,
      }),
      countStats: async () => emptyStats,
      verifyCounts: async () => ({
        ok: false,
        stats: emptyStats,
        completedIngestionRuns: 0,
        failures: [],
      }),
      getLatestRun: async () => null,
    }),
  );

  assert.equal(report.success, false);
  assert.equal(report.stage, "validation");
});

test("preflight blocks unrelated MySecondApp database names", async () => {
  const result = await runDatabaseTargetPreflight({
    DATABASE_URL: "postgresql://user:pass@localhost:5432/mysecondapp",
  } as unknown as NodeJS.ProcessEnv);

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.match(result.reason, /blocked/i);
  }
});

test("classifyDatabaseSchema treats unrelated public tables as unrelated", () => {
  const result = classifyDatabaseSchema({
    publicTables: ["users"],
    applicationSchemas: [],
  });

  assert.equal(result.kind, "unrelated_nonempty_database");
});

test("catalogue health reports empty before data", async () => {
  const originalResolve = process.env.DATABASE_URL;
  delete process.env.DATABASE_URL;
  delete process.env.POSTGRES_URL;

  const status = await getCataloguePublicStatus();
  assert.equal(status, "not_configured");

  process.env.DATABASE_URL = originalResolve;
});

test("catalogue health reports ready after meaningful data", () => {
  const empty = verifyBootstrapMinimumCounts({
    stats: emptyStats,
    completedIngestionRuns: 0,
  });
  const ready = verifyBootstrapMinimumCounts({
    stats: {
      brands: 3,
      models: 3,
      variants: 3,
      verifiedFacts: 1,
      conflictingFacts: 0,
      currentOffers: 1,
      commercialConditions: 1,
      sourcePages: 1,
    },
    completedIngestionRuns: 1,
  });

  assert.equal(empty.ok, false);
  assert.equal(ready.ok, true);
});

test("catalogue status snapshot shape is safe", async () => {
  const snapshot = await getCatalogueStatusSnapshot();
  assert.ok(["ready", "empty", "error"].includes(snapshot.status));
  assert.ok(["connected", "not_configured", "error"].includes(snapshot.database));
  assert.equal(typeof snapshot.brands, "number");
  assert.equal(typeof snapshot.issues.warnings, "number");
});
