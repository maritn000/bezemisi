import { eq, sql } from "drizzle-orm";

import { createDb } from "@/db/create-client";
import { catalogueIngestionIssues } from "@/db/schema";
import { countCatalogueStats } from "@/lib/catalogue/repositories/catalogue-repository";
import { resolveDatabaseUrlFromEnv } from "@/lib/database-url";

import { CATALOGUE_TABLES } from "./bootstrap/constants";
import { getLatestIngestionRun } from "./bootstrap/verify-counts";

export type CataloguePublicStatus =
  | "ready"
  | "empty"
  | "error"
  | "not_configured";

export type CatalogueStatusSnapshot = {
  status: "ready" | "empty" | "error";
  database: "connected" | "not_configured" | "error";
  tablesPresent: boolean;
  brands: number;
  models: number;
  variants: number;
  verifiedFacts: number;
  currentOffers: number;
  commercialConditions: number;
  lastIngestionStatus: string | null;
  lastIngestionAt: string | null;
  issues: {
    warnings: number;
    errors: number;
  };
};

function hasMeaningfulCatalogueData(stats: Awaited<ReturnType<typeof countCatalogueStats>>) {
  return (
    stats.brands > 0 &&
    stats.models > 0 &&
    stats.variants > 0 &&
    stats.verifiedFacts > 0 &&
    stats.sourcePages > 0
  );
}

async function areCatalogueTablesPresent(databaseUrl: string): Promise<boolean> {
  const db = createDb(databaseUrl);
  const tablesResult = await db.execute<{ table_name: string }>(sql`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
  `);

  const existingTables = new Set(
    tablesResult.rows.map((row) => row.table_name),
  );

  return CATALOGUE_TABLES.every((table) => existingTables.has(table));
}

export async function getCataloguePublicStatus(): Promise<CataloguePublicStatus> {
  let databaseUrl: string;
  try {
    databaseUrl = resolveDatabaseUrlFromEnv().url;
  } catch {
    return "not_configured";
  }

  try {
    const tablesPresent = await areCatalogueTablesPresent(databaseUrl);
    if (!tablesPresent) {
      return "empty";
    }

    const stats = await countCatalogueStats();
    return hasMeaningfulCatalogueData(stats) ? "ready" : "empty";
  } catch {
    return "error";
  }
}

export async function getCatalogueStatusSnapshot(): Promise<CatalogueStatusSnapshot> {
  let databaseUrl: string;
  try {
    databaseUrl = resolveDatabaseUrlFromEnv().url;
  } catch {
    return {
      status: "error",
      database: "not_configured",
      tablesPresent: false,
      brands: 0,
      models: 0,
      variants: 0,
      verifiedFacts: 0,
      currentOffers: 0,
      commercialConditions: 0,
      lastIngestionStatus: null,
      lastIngestionAt: null,
      issues: { warnings: 0, errors: 0 },
    };
  }

  try {
    const db = createDb(databaseUrl);
    await db.execute(sql`select 1 as health_check`);

    const tablesPresent = await areCatalogueTablesPresent(databaseUrl);
    if (!tablesPresent) {
      return {
        status: "empty",
        database: "connected",
        tablesPresent: false,
        brands: 0,
        models: 0,
        variants: 0,
        verifiedFacts: 0,
        currentOffers: 0,
        commercialConditions: 0,
        lastIngestionStatus: null,
        lastIngestionAt: null,
        issues: { warnings: 0, errors: 0 },
      };
    }

    const stats = await countCatalogueStats();
    const latestRun = await getLatestIngestionRun(databaseUrl);

    const issueRows = latestRun
      ? await db
          .select({
            severity: catalogueIngestionIssues.severity,
          })
          .from(catalogueIngestionIssues)
          .where(eq(catalogueIngestionIssues.ingestionRunId, latestRun.id))
      : [];

    const warnings = issueRows.filter((row) => row.severity === "warning").length;
    const errors = issueRows.filter((row) => row.severity === "error").length;

    const status = hasMeaningfulCatalogueData(stats) ? "ready" : "empty";

    return {
      status,
      database: "connected",
      tablesPresent: true,
      brands: stats.brands,
      models: stats.models,
      variants: stats.variants,
      verifiedFacts: stats.verifiedFacts,
      currentOffers: stats.currentOffers,
      commercialConditions: stats.commercialConditions,
      lastIngestionStatus: latestRun?.status ?? null,
      lastIngestionAt: latestRun?.completedAt?.toISOString() ?? null,
      issues: { warnings, errors },
    };
  } catch {
    return {
      status: "error",
      database: "error",
      tablesPresent: false,
      brands: 0,
      models: 0,
      variants: 0,
      verifiedFacts: 0,
      currentOffers: 0,
      commercialConditions: 0,
      lastIngestionStatus: null,
      lastIngestionAt: null,
      issues: { warnings: 0, errors: 0 },
    };
  }
}
