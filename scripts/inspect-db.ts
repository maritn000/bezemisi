import { config } from "dotenv";
import { sql } from "drizzle-orm";

import { createDb } from "../src/db/create-client";
import { getDatabaseUrlSourceKey } from "../src/env";
import { redactDatabaseUrl, resolveDatabaseUrlFromEnv } from "../src/lib/database-url";

config({ path: ".env.local" });

async function main() {
  const sourceKey = getDatabaseUrlSourceKey();
  const redacted = redactDatabaseUrl(resolveDatabaseUrlFromEnv().url);

  const db = createDb();
  const tables = await db.execute(sql`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name
  `);

  const migrationRows = await db.execute(sql`
    SELECT id, hash, created_at
    FROM drizzle.__drizzle_migrations
    ORDER BY created_at
  `).catch(() => ({ rows: [] as Array<Record<string, unknown>> }));

  console.log(
    JSON.stringify(
      {
        databaseUrlSourceKey: sourceKey,
        host: redacted.host,
        database: redacted.database,
        tables: tables.rows.map((row) => row.table_name),
        migrations: migrationRows.rows,
        foundationTablesPresent: [
          "app_health_checks",
          "sources",
          "conversations",
          "messages",
        ].every((table) =>
          tables.rows.some((row) => row.table_name === table),
        ),
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error("Database inspection failed", error);
  process.exitCode = 1;
});
