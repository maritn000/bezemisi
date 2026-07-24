import assert from "node:assert/strict";
import test from "node:test";

import { isCatalogueBootstrapEnabled } from "@/lib/catalogue/bootstrap/flags";
import { runDatabaseTargetPreflight } from "@/lib/catalogue/bootstrap/preflight";
import {
  runCatalogueBootstrap,
} from "@/lib/catalogue/bootstrap/run-bootstrap";
import { verifyBootstrapMinimumCounts } from "@/lib/catalogue/bootstrap/verify-counts";
import {
  getCataloguePublicStatus,
  getCatalogueStatusSnapshot,
} from "@/lib/catalogue/catalogue-health";

test("bootstrap is disabled by default", async () => {
  assert.equal(isCatalogueBootstrapEnabled(undefined), false);
  assert.equal(isCatalogueBootstrapEnabled(""), false);
  assert.equal(isCatalogueBootstrapEnabled("false"), false);
  assert.equal(isCatalogueBootstrapEnabled("TRUE"), false);

  const report = await runCatalogueBootstrap({
  isEnabled: () => false,
  preflight: async () => ({ ok: false, reason: "should not run" }),
  inspectSchema: async () => {
    throw new Error("should not run");
  },
  migrate: async () => {
    throw new Error("should not run");
  },
  verifySchema: async () => ({ ok: true, missingTables: [] }),
  ingest: async () => {
    throw new Error("should not run");
  },
  validate: async () => ({
    valid: true,
    issues: [],
    stats: {
      brands: 0,
      models: 0,
      variants: 0,
      verifiedFacts: 0,
      conflictingFacts: 0,
      currentOffers: 0,
      commercialConditions: 0,
      sourcePages: 0,
    },
  }),
  countStats: async () => ({
    brands: 0,
    models: 0,
    variants: 0,
    verifiedFacts: 0,
    conflictingFacts: 0,
    currentOffers: 0,
    commercialConditions: 0,
    sourcePages: 0,
  }),
  verifyCounts: async () => ({
    ok: false,
    stats: {
      brands: 0,
      models: 0,
      variants: 0,
      verifiedFacts: 0,
      conflictingFacts: 0,
      currentOffers: 0,
      commercialConditions: 0,
      sourcePages: 0,
    },
    completedIngestionRuns: 0,
    failures: [],
  }),
  getLatestRun: async () => null,
});

  assert.equal(report.enabled, false);
  assert.equal(report.success, true);
  assert.equal(report.stage, "disabled");
});

test("bootstrap runs only with the exact RUN_CATALOGUE_BOOTSTRAP=true flag", () => {
  assert.equal(isCatalogueBootstrapEnabled("true"), true);
});

test("incorrect database target aborts before writes", async () => {
  let migrateCalled = false;
  let ingestCalled = false;

  const report = await runCatalogueBootstrap({
    isEnabled: () => true,
    preflight: async () => ({
      ok: false,
      reason: "Expected Bez emisí foundation tables are missing (app_health_checks, sources, conversations, messages); refusing to bootstrap an unrelated database. Run \"npm run db:prepare-bootstrap\" against the correct Production database first.",
    }),
    inspectSchema: async () => {
      throw new Error("should not run");
    },
    migrate: async () => {
      migrateCalled = true;
    },
    verifySchema: async () => ({ ok: true, missingTables: [] }),
    ingest: async () => {
      ingestCalled = true;
      return {
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
      };
    },
    validate: async () => ({
      valid: true,
      issues: [],
      stats: {
        brands: 0,
        models: 0,
        variants: 0,
        verifiedFacts: 0,
        conflictingFacts: 0,
        currentOffers: 0,
        commercialConditions: 0,
        sourcePages: 0,
      },
    }),
    countStats: async () => ({
      brands: 0,
      models: 0,
      variants: 0,
      verifiedFacts: 0,
      conflictingFacts: 0,
      currentOffers: 0,
      commercialConditions: 0,
      sourcePages: 0,
    }),
    verifyCounts: async () => ({
      ok: false,
      stats: {
        brands: 0,
        models: 0,
        variants: 0,
        verifiedFacts: 0,
        conflictingFacts: 0,
        currentOffers: 0,
        commercialConditions: 0,
        sourcePages: 0,
      },
      completedIngestionRuns: 0,
      failures: [],
    }),
    getLatestRun: async () => null,
  });

  assert.equal(report.success, false);
  assert.equal(report.stage, "preflight");
  assert.equal(migrateCalled, false);
  assert.equal(ingestCalled, false);
});

test("migration failure prevents ingestion", async () => {
  let ingestCalled = false;

  const report = await runCatalogueBootstrap({
    isEnabled: () => true,
    preflight: async () => ({
      ok: true,
      resolved: { url: "postgresql://user:pass@localhost:5432/bezemisi", sourceKey: "DATABASE_URL" },
      redacted: { host: "localhost", database: "bezemisi", user: "***" },
      sourceKey: "DATABASE_URL",
      foundationTablesPresent: true,
      existingTables: ["app_health_checks", "sources", "conversations", "messages"],
    }),
    inspectSchema: async () => ({
      existingTables: ["app_health_checks"],
      catalogueTablesPresent: false,
      appliedMigrations: [],
      catalogueMigrationApplied: false,
    }),
    migrate: async () => {
      throw new Error("migration failed");
    },
    verifySchema: async () => ({ ok: true, missingTables: [] }),
    ingest: async () => {
      ingestCalled = true;
      return {
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
      };
    },
    validate: async () => ({
      valid: true,
      issues: [],
      stats: {
        brands: 0,
        models: 0,
        variants: 0,
        verifiedFacts: 0,
        conflictingFacts: 0,
        currentOffers: 0,
        commercialConditions: 0,
        sourcePages: 0,
      },
    }),
    countStats: async () => ({
      brands: 0,
      models: 0,
      variants: 0,
      verifiedFacts: 0,
      conflictingFacts: 0,
      currentOffers: 0,
      commercialConditions: 0,
      sourcePages: 0,
    }),
    verifyCounts: async () => ({
      ok: false,
      stats: {
        brands: 0,
        models: 0,
        variants: 0,
        verifiedFacts: 0,
        conflictingFacts: 0,
        currentOffers: 0,
        commercialConditions: 0,
        sourcePages: 0,
      },
      completedIngestionRuns: 0,
      failures: [],
    }),
    getLatestRun: async () => null,
  });

  assert.equal(report.success, false);
  assert.equal(report.stage, "migration");
  assert.equal(ingestCalled, false);
});

test("empty ingestion fails verification", async () => {
  const report = await runCatalogueBootstrap({
    isEnabled: () => true,
    preflight: async () => ({
      ok: true,
      resolved: { url: "postgresql://user:pass@localhost:5432/bezemisi", sourceKey: "DATABASE_URL" },
      redacted: { host: "localhost", database: "bezemisi", user: "***" },
      sourceKey: "DATABASE_URL",
      foundationTablesPresent: true,
      existingTables: ["app_health_checks", "sources", "conversations", "messages"],
    }),
    inspectSchema: async () => ({
      existingTables: [],
      catalogueTablesPresent: true,
      appliedMigrations: [],
      catalogueMigrationApplied: true,
    }),
    migrate: async () => {},
    verifySchema: async () => ({ ok: true, missingTables: [] }),
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
      stats: {
        brands: 0,
        models: 0,
        variants: 0,
        verifiedFacts: 0,
        conflictingFacts: 0,
        currentOffers: 0,
        commercialConditions: 0,
        sourcePages: 0,
      },
    }),
    countStats: async () => ({
      brands: 0,
      models: 0,
      variants: 0,
      verifiedFacts: 0,
      conflictingFacts: 0,
      currentOffers: 0,
      commercialConditions: 0,
      sourcePages: 0,
    }),
    verifyCounts: async () => ({
      ok: false,
      stats: {
        brands: 0,
        models: 0,
        variants: 0,
        verifiedFacts: 0,
        conflictingFacts: 0,
        currentOffers: 0,
        commercialConditions: 0,
        sourcePages: 0,
      },
      completedIngestionRuns: 0,
      failures: ["All catalogue tables are empty after ingestion."],
    }),
    getLatestRun: async () => null,
  });

  assert.equal(report.success, false);
  assert.equal(report.stage, "row_count_verification");
  assert.ok(report.errors.some((error) => error.includes("empty")));
});

test("successful ingestion returns real row counts", async () => {
  const report = await runCatalogueBootstrap({
    isEnabled: () => true,
    preflight: async () => ({
      ok: true,
      resolved: { url: "postgresql://user:pass@localhost:5432/bezemisi", sourceKey: "DATABASE_URL" },
      redacted: { host: "localhost", database: "bezemisi", user: "***" },
      sourceKey: "DATABASE_URL",
      foundationTablesPresent: true,
      existingTables: ["app_health_checks", "sources", "conversations", "messages"],
    }),
    inspectSchema: async () => ({
      existingTables: [],
      catalogueTablesPresent: true,
      appliedMigrations: [],
      catalogueMigrationApplied: true,
    }),
    migrate: async () => {},
    verifySchema: async () => ({ ok: true, missingTables: [] }),
    ingest: async () => ({
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
      discoveredUrls: [],
    }),
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
  });

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

test("validation critical errors fail bootstrap", async () => {
  const report = await runCatalogueBootstrap({
    isEnabled: () => true,
    preflight: async () => ({
      ok: true,
      resolved: { url: "postgresql://user:pass@localhost:5432/bezemisi", sourceKey: "DATABASE_URL" },
      redacted: { host: "localhost", database: "bezemisi", user: "***" },
      sourceKey: "DATABASE_URL",
      foundationTablesPresent: true,
      existingTables: ["app_health_checks", "sources", "conversations", "messages"],
    }),
    inspectSchema: async () => ({
      existingTables: [],
      catalogueTablesPresent: true,
      appliedMigrations: [],
      catalogueMigrationApplied: true,
    }),
    migrate: async () => {},
    verifySchema: async () => ({ ok: true, missingTables: [] }),
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
      stats: {
        brands: 0,
        models: 0,
        variants: 0,
        verifiedFacts: 0,
        conflictingFacts: 0,
        currentOffers: 0,
        commercialConditions: 0,
        sourcePages: 0,
      },
    }),
    countStats: async () => ({
      brands: 0,
      models: 0,
      variants: 0,
      verifiedFacts: 0,
      conflictingFacts: 0,
      currentOffers: 0,
      commercialConditions: 0,
      sourcePages: 0,
    }),
    verifyCounts: async () => ({
      ok: false,
      stats: {
        brands: 0,
        models: 0,
        variants: 0,
        verifiedFacts: 0,
        conflictingFacts: 0,
        currentOffers: 0,
        commercialConditions: 0,
        sourcePages: 0,
      },
      completedIngestionRuns: 0,
      failures: [],
    }),
    getLatestRun: async () => null,
  });

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
    stats: {
      brands: 0,
      models: 0,
      variants: 0,
      verifiedFacts: 0,
      conflictingFacts: 0,
      currentOffers: 0,
      commercialConditions: 0,
      sourcePages: 0,
    },
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
