import { eq } from "drizzle-orm";

import { createDb } from "@/db/create-client";
import { appHealthChecks } from "@/db/schema";

export type DatabaseVerificationResult = {
  success: boolean;
  healthCheckId?: string;
  status?: string;
  error?: string;
};

export async function verifyDatabaseReadWrite(): Promise<DatabaseVerificationResult> {
  const db = createDb();

  try {
    const [inserted] = await db
      .insert(appHealthChecks)
      .values({
        status: "verified",
        details: {
          source: "db:verify",
          phase: "database-foundation",
        },
      })
      .returning({
        id: appHealthChecks.id,
        status: appHealthChecks.status,
      });

    if (!inserted) {
      return {
        success: false,
        error: "Insert did not return a row",
      };
    }

    const [selected] = await db
      .select({
        id: appHealthChecks.id,
        status: appHealthChecks.status,
      })
      .from(appHealthChecks)
      .where(eq(appHealthChecks.id, inserted.id))
      .limit(1);

    if (!selected || selected.status !== inserted.status) {
      return {
        success: false,
        error: "Read-back verification failed",
      };
    }

    return {
      success: true,
      healthCheckId: selected.id,
      status: selected.status,
    };
  } catch (error) {
    console.error("Database verification failed", error);

    return {
      success: false,
      error: "Database verification failed",
    };
  }
}
