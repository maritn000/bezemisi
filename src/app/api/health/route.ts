import { NextResponse } from "next/server";

import { getCataloguePublicStatus } from "@/lib/catalogue/catalogue-health";
import { isOpenAIConfigured } from "@/lib/chat/model-config";
import { checkDatabaseHealth } from "@/lib/db/health";

export async function GET() {
  const timestamp = new Date().toISOString();
  const { status: database } = await checkDatabaseHealth();
  const catalogue = await getCataloguePublicStatus();
  const openai = isOpenAIConfigured() ? "configured" : "not_configured";

  let status: "ok" | "degraded" | "error" = "ok";
  if (database === "error") {
    status = "error";
  } else if (database !== "connected" || openai !== "configured") {
    status = "degraded";
  }

  return NextResponse.json(
    {
      status,
      application: "ok",
      database,
      catalogue,
      openai,
      timestamp,
    },
    {
      status: status === "error" ? 503 : 200,
    },
  );
}
