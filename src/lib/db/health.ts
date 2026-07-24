import { sql } from "drizzle-orm";

import { createDb } from "@/db/create-client";
import { resolveDatabaseUrlFromEnv } from "@/lib/database-url";

export type DatabaseHealthResult = {
  status: "connected" | "not_configured" | "error";
};

export async function checkDatabaseHealth(): Promise<DatabaseHealthResult> {
  try {
    resolveDatabaseUrlFromEnv();
  } catch {
    return { status: "not_configured" };
  }

  try {
    const db = createDb();
    await db.execute(sql`select 1 as health_check`);
    return { status: "connected" };
  } catch (error) {
    console.error("Database health check failed", error);
    return { status: "error" };
  }
}
