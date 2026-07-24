import { sql } from "drizzle-orm";

import { createDb } from "@/db/create-client";

export type DatabaseHealthResult = {
  status: "connected" | "error";
};

export async function checkDatabaseHealth(): Promise<DatabaseHealthResult> {
  try {
    const db = createDb();

    await db.execute(sql`select 1 as health_check`);

    return { status: "connected" };
  } catch (error) {
    console.error("Database health check failed", error);

    return { status: "error" };
  }
}
