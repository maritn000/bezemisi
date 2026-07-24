import { sql } from "drizzle-orm";

import { createDb } from "@/db/create-client";
import {
  redactDatabaseUrl,
  type ResolvedDatabaseUrl,
  resolveDatabaseUrlFromEnv,
} from "@/lib/database-url";

import {
  classifyDatabaseSchema,
  formatUnrelatedDatabaseReason,
  inspectDatabaseSchema,
  type DatabaseTargetKind,
} from "./classify-database";
import { BLOCKED_DATABASE_IDENTIFIERS } from "./constants";

export type DatabaseTargetClassification = DatabaseTargetKind;

export type DatabaseTargetPreflight = {
  ok: true;
  resolved: ResolvedDatabaseUrl;
  redacted: ReturnType<typeof redactDatabaseUrl>;
  sourceKey: string;
  classification: DatabaseTargetClassification;
  existingTables: string[];
};

export type DatabaseTargetPreflightFailure = {
  ok: false;
  reason: string;
  classification?: DatabaseTargetClassification;
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
      classification: "unavailable",
    };
  }

  const redacted = redactDatabaseUrl(resolved.url);
  if (!redacted.database || redacted.database === "unknown") {
    return {
      ok: false,
      reason: "Database target could not be identified from the connection string.",
      classification: "unavailable",
    };
  }

  if (isBlockedDatabaseName(redacted.database)) {
    return {
      ok: false,
      reason: `Database target "${redacted.database}" is blocked for catalogue bootstrap.`,
      classification: "unavailable",
    };
  }

  const db = createDb(resolved.url);

  try {
    await db.execute(sql`select 1 as health_check`);
  } catch {
    return {
      ok: false,
      reason: "Database connection is unavailable.",
      classification: "unavailable",
    };
  }

  const inventory = await inspectDatabaseSchema(resolved.url);
  const classification = classifyDatabaseSchema(inventory);

  if (classification.kind === "unrelated_nonempty_database") {
    return {
      ok: false,
      reason: formatUnrelatedDatabaseReason(classification),
      classification: classification.kind,
    };
  }

  return {
    ok: true,
    resolved,
    redacted,
    sourceKey: resolved.sourceKey,
    classification: classification.kind,
    existingTables:
      classification.kind === "existing_bezemisi_database"
        ? classification.existingTables
        : inventory.publicTables,
  };
}
