import { sql } from "drizzle-orm";

import { createDb } from "@/db/create-client";
import {
  redactDatabaseUrl,
  type ResolvedDatabaseUrl,
  resolveDatabaseUrlFromEnv,
} from "@/lib/database-url";

import {
  BLOCKED_DATABASE_IDENTIFIERS,
  FOUNDATION_TABLES,
} from "./constants";

export type DatabaseTargetPreflight = {
  ok: true;
  resolved: ResolvedDatabaseUrl;
  redacted: ReturnType<typeof redactDatabaseUrl>;
  sourceKey: string;
  foundationTablesPresent: boolean;
  existingTables: string[];
};

export type DatabaseTargetPreflightFailure = {
  ok: false;
  reason: string;
};

export type DatabaseTargetPreflightResult =
  | DatabaseTargetPreflight
  | DatabaseTargetPreflightFailure;

function isBlockedDatabaseName(databaseName: string): boolean {
  const normalized = databaseName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
  return BLOCKED_DATABASE_IDENTIFIERS.some(
    (blocked) => normalized === blocked.replace(/[^a-z0-9]+/g, ""),
  );
}

export async function runDatabaseTargetPreflight(
  env: NodeJS.ProcessEnv = process.env,
): Promise<DatabaseTargetPreflightResult> {
  let resolved: ResolvedDatabaseUrl;
  try {
    resolved = resolveDatabaseUrlFromEnv(env);
  } catch {
    return {
      ok: false,
      reason: "Database connection is not configured.",
    };
  }

  const redacted = redactDatabaseUrl(resolved.url);
  if (!redacted.database || redacted.database === "unknown") {
    return {
      ok: false,
      reason: "Database target could not be identified from the connection string.",
    };
  }

  if (isBlockedDatabaseName(redacted.database)) {
    return {
      ok: false,
      reason: `Database target "${redacted.database}" is blocked for catalogue bootstrap.`,
    };
  }

  const db = createDb(resolved.url);

  try {
    await db.execute(sql`select 1 as health_check`);
  } catch {
    return {
      ok: false,
      reason: "Database connection is unavailable.",
    };
  }

  const tablesResult = await db.execute<{ table_name: string }>(sql`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name
  `);

  const existingTables = tablesResult.rows.map((row) => row.table_name);
  const foundationTablesPresent = FOUNDATION_TABLES.every((table) =>
    existingTables.includes(table),
  );

  if (!foundationTablesPresent) {
    return {
      ok: false,
      reason:
        "Expected Bez emisí foundation tables are missing; refusing to bootstrap an unrelated database.",
    };
  }

  return {
    ok: true,
    resolved,
    redacted,
    sourceKey: resolved.sourceKey,
    foundationTablesPresent,
    existingTables,
  };
}
