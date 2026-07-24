import { desc, inArray, sql } from "drizzle-orm";

import { createDb } from "@/db/create-client";
import { catalogueIngestionRuns } from "@/db/schema";
import type { countCatalogueStats } from "@/lib/catalogue/repositories/catalogue-repository";

import { MINIMUM_BOOTSTRAP_COUNTS } from "./constants";

export type CatalogueCountStats = Awaited<ReturnType<typeof countCatalogueStats>>;

export type BootstrapCountVerification = {
  ok: boolean;
  stats: CatalogueCountStats;
  completedIngestionRuns: number;
  failures: string[];
};

export async function countCompletedIngestionRuns(
  databaseUrl: string,
): Promise<number> {
  const db = createDb(databaseUrl);
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(catalogueIngestionRuns)
    .where(
      inArray(catalogueIngestionRuns.status, [
        "completed",
        "completed_with_warnings",
      ]),
    );

  return row?.count ?? 0;
}

export async function getLatestIngestionRun(
  databaseUrl: string,
): Promise<typeof catalogueIngestionRuns.$inferSelect | null> {
  const db = createDb(databaseUrl);
  const [run] = await db
    .select()
    .from(catalogueIngestionRuns)
    .orderBy(desc(catalogueIngestionRuns.completedAt))
    .limit(1);

  return run ?? null;
}

export function verifyBootstrapMinimumCounts(input: {
  stats: CatalogueCountStats;
  completedIngestionRuns: number;
}): BootstrapCountVerification {
  const failures: string[] = [];

  if (input.stats.brands < MINIMUM_BOOTSTRAP_COUNTS.brands) {
    failures.push(
      `Expected at least ${MINIMUM_BOOTSTRAP_COUNTS.brands} vehicle brands, found ${input.stats.brands}.`,
    );
  }

  if (input.stats.models < MINIMUM_BOOTSTRAP_COUNTS.models) {
    failures.push(
      `Expected at least ${MINIMUM_BOOTSTRAP_COUNTS.models} vehicle models, found ${input.stats.models}.`,
    );
  }

  if (input.stats.variants < MINIMUM_BOOTSTRAP_COUNTS.variants) {
    failures.push(
      `Expected at least ${MINIMUM_BOOTSTRAP_COUNTS.variants} reliably identified variants, found ${input.stats.variants}.`,
    );
  }

  if (input.stats.sourcePages < MINIMUM_BOOTSTRAP_COUNTS.sourcePages) {
    failures.push(
      `Expected at least ${MINIMUM_BOOTSTRAP_COUNTS.sourcePages} source page, found ${input.stats.sourcePages}.`,
    );
  }

  if (input.stats.verifiedFacts < MINIMUM_BOOTSTRAP_COUNTS.verifiedFacts) {
    failures.push(
      `Expected at least ${MINIMUM_BOOTSTRAP_COUNTS.verifiedFacts} verified specification, found ${input.stats.verifiedFacts}.`,
    );
  }

  if (
    input.completedIngestionRuns < MINIMUM_BOOTSTRAP_COUNTS.completedIngestionRuns
  ) {
    failures.push(
      `Expected at least ${MINIMUM_BOOTSTRAP_COUNTS.completedIngestionRuns} completed ingestion run, found ${input.completedIngestionRuns}.`,
    );
  }

  const allCatalogueTablesEmpty =
    input.stats.brands === 0 &&
    input.stats.models === 0 &&
    input.stats.variants === 0 &&
    input.stats.sourcePages === 0 &&
    input.stats.verifiedFacts === 0;

  if (allCatalogueTablesEmpty) {
    failures.push("All catalogue tables are empty after ingestion.");
  }

  return {
    ok: failures.length === 0,
    stats: input.stats,
    completedIngestionRuns: input.completedIngestionRuns,
    failures,
  };
}

export async function verifyBootstrapRowCounts(
  databaseUrl: string,
  stats: CatalogueCountStats,
): Promise<BootstrapCountVerification> {
  const completedIngestionRuns = await countCompletedIngestionRuns(databaseUrl);
  return verifyBootstrapMinimumCounts({ stats, completedIngestionRuns });
}
