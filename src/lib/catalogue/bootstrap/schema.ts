import path from "node:path";

import { sql } from "drizzle-orm";
import { migrate } from "drizzle-orm/neon-http/migrator";

import { createDb } from "@/db/create-client";

import {
  CATALOGUE_MIGRATION_TAG,
  CATALOGUE_TABLES,
} from "./constants";

export type SchemaInspection = {
  existingTables: string[];
  catalogueTablesPresent: boolean;
  appliedMigrations: Array<{
    id: number;
    hash: string;
    createdAt: string | null;
  }>;
  catalogueMigrationApplied: boolean;
};

export async function inspectCurrentSchema(
  databaseUrl: string,
): Promise<SchemaInspection> {
  const db = createDb(databaseUrl);

  const tablesResult = await db.execute<{ table_name: string }>(sql`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name
  `);

  const existingTables = tablesResult.rows.map((row) => row.table_name);
  const catalogueTablesPresent = CATALOGUE_TABLES.every((table) =>
    existingTables.includes(table),
  );

  const migrationRows = await db
    .execute<{
      id: number;
      hash: string;
      created_at: string | Date | null;
    }>(sql`
      SELECT id, hash, created_at
      FROM drizzle.__drizzle_migrations
      ORDER BY created_at
    `)
    .catch(() => ({ rows: [] as Array<{ id: number; hash: string; created_at: string | Date | null }> }));

  const appliedMigrations = migrationRows.rows.map((row) => ({
    id: row.id,
    hash: row.hash,
    createdAt:
      row.created_at instanceof Date
        ? row.created_at.toISOString()
        : row.created_at,
  }));

  const catalogueMigrationApplied = appliedMigrations.length >= 2;

  return {
    existingTables,
    catalogueTablesPresent,
    appliedMigrations,
    catalogueMigrationApplied,
  };
}

export async function runPendingCatalogueMigrations(
  databaseUrl: string,
): Promise<void> {
  const db = createDb(databaseUrl);
  await migrate(db, {
    migrationsFolder: path.join(process.cwd(), "drizzle"),
  });
}

export async function verifyCatalogueSchema(databaseUrl: string): Promise<{
  ok: boolean;
  missingTables: string[];
}> {
  const inspection = await inspectCurrentSchema(databaseUrl);
  const missingTables = CATALOGUE_TABLES.filter(
    (table) => !inspection.existingTables.includes(table),
  );

  return {
    ok: missingTables.length === 0,
    missingTables,
  };
}

export function formatMigrationTagForLog(): string {
  return CATALOGUE_MIGRATION_TAG;
}
