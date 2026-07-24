import { NextResponse } from "next/server";

import { checkDatabaseHealth } from "@/lib/db/health";

export async function GET() {
  const timestamp = new Date().toISOString();
  const databaseHealth = await checkDatabaseHealth();
  const databaseStatus = databaseHealth.status;
  const overallStatus = databaseStatus === "connected" ? "ok" : "degraded";

  return NextResponse.json(
    {
      status: overallStatus,
      application: "ok",
      database: databaseStatus,
      timestamp,
    },
    {
      status: databaseStatus === "connected" ? 200 : 503,
    },
  );
}
