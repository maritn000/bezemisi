import { sql } from "drizzle-orm";

import { createDb } from "@/db/create-client";

import {
  ALL_BEZEMISI_TABLES,
  FOUNDATION_TABLES,
  IGNORED_APPLICATION_SCHEMAS,
  POSTGRES_SYSTEM_SCHEMAS,
} from "./constants";

export type DatabaseTargetKind =
  | "empty_database"
  | "existing_bezemisi_database"
  | "unrelated_nonempty_database"
  | "unavailable";

export type SchemaInventory = {
  publicTables: string[];
  applicationSchemas: Array<{
    schemaName: string;
    tables: string[];
  }>;
};

export type DatabaseClassification =
  | {
      kind: "empty_database";
    }
  | {
      kind: "existing_bezemisi_database";
      existingTables: string[];
    }
  | {
      kind: "unrelated_nonempty_database";
      unexpectedTables: string[];
      unexpectedSchemas: string[];
    };

const bezemisiTableSet = new Set<string>(ALL_BEZEMISI_TABLES);
const ignoredSchemaSet = new Set<string>(IGNORED_APPLICATION_SCHEMAS);
const systemSchemaSet = new Set<string>(POSTGRES_SYSTEM_SCHEMAS);

function hasFoundationTables(publicTables: readonly string[]): boolean {
  return FOUNDATION_TABLES.every((table) => publicTables.includes(table));
}

function getBezemisiTables(publicTables: readonly string[]): string[] {
  return publicTables.filter((table) => bezemisiTableSet.has(table));
}

function getUnrelatedPublicTables(publicTables: readonly string[]): string[] {
  return publicTables.filter((table) => !bezemisiTableSet.has(table));
}

function getUnexpectedApplicationSchemas(
  applicationSchemas: SchemaInventory["applicationSchemas"],
): string[] {
  return applicationSchemas
    .filter(
      (schema) =>
        !systemSchemaSet.has(schema.schemaName) &&
        !ignoredSchemaSet.has(schema.schemaName) &&
        schema.tables.length > 0,
    )
    .map((schema) => schema.schemaName);
}

export function classifyDatabaseSchema(
  inventory: SchemaInventory,
): DatabaseClassification {
  const { publicTables, applicationSchemas } = inventory;

  if (hasFoundationTables(publicTables)) {
    return {
      kind: "existing_bezemisi_database",
      existingTables: [...publicTables],
    };
  }

  const bezemisiTables = getBezemisiTables(publicTables);
  const unrelatedPublicTables = getUnrelatedPublicTables(publicTables);
  const unexpectedSchemas = getUnexpectedApplicationSchemas(applicationSchemas);

  const unexpectedTables = [
    ...unrelatedPublicTables,
    ...bezemisiTables.map((table) => `${table} (partial Bez emisí schema)`),
  ];

  if (unexpectedTables.length > 0 || unexpectedSchemas.length > 0) {
    return {
      kind: "unrelated_nonempty_database",
      unexpectedTables,
      unexpectedSchemas,
    };
  }

  return { kind: "empty_database" };
}

export function formatUnrelatedDatabaseReason(
  classification: Extract<
    DatabaseClassification,
    { kind: "unrelated_nonempty_database" }
  >,
): string {
  const details: string[] = [];

  if (classification.unexpectedTables.length > 0) {
    details.push(
      `unexpected tables: ${classification.unexpectedTables.join(", ")}`,
    );
  }

  if (classification.unexpectedSchemas.length > 0) {
    details.push(
      `unexpected schemas: ${classification.unexpectedSchemas.join(", ")}`,
    );
  }

  return `Refusing to bootstrap an unrelated database (${details.join("; ")}).`;
}

export async function inspectDatabaseSchema(
  databaseUrl: string,
): Promise<SchemaInventory> {
  const db = createDb(databaseUrl);

  const tablesResult = await db.execute<{
    table_schema: string;
    table_name: string;
  }>(sql`
    SELECT table_schema, table_name
    FROM information_schema.tables
    WHERE table_type = 'BASE TABLE'
      AND table_schema NOT IN (${sql.join(
        POSTGRES_SYSTEM_SCHEMAS.map((schema) => sql`${schema}`),
        sql`, `,
      )})
    ORDER BY table_schema, table_name
  `);

  const publicTables: string[] = [];
  const schemaMap = new Map<string, string[]>();

  for (const row of tablesResult.rows) {
    if (row.table_schema === "public") {
      publicTables.push(row.table_name);
      continue;
    }

    const tables = schemaMap.get(row.table_schema) ?? [];
    tables.push(row.table_name);
    schemaMap.set(row.table_schema, tables);
  }

  return {
    publicTables,
    applicationSchemas: [...schemaMap.entries()].map(
      ([schemaName, tables]) => ({
        schemaName,
        tables,
      }),
    ),
  };
}
