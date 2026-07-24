import { NextResponse } from "next/server";

import { isOpenAIConfigured } from "@/lib/chat/model-config";
import { checkDatabaseHealth } from "@/lib/db/health";

export async function GET() {
  const timestamp = new Date().toISOString();
  const databaseHealth = await checkDatabaseHealth();
  const databaseStatus = databaseHealth.status;

  return NextResponse.json(
    {
      application: "ok",
      database: databaseStatus,
      openai: isOpenAIConfigured() ? "configured" : "not_configured",
      timestamp,
    },
    {
      status: databaseStatus === "connected" ? 200 : 503,
    },
  );
}
