import { NextResponse } from "next/server";

import {
  isCatalogueAdminAuthorized,
  isCatalogueAdminConfigured,
} from "@/lib/catalogue/admin-auth";
import { runFullCatalogueIngestion } from "@/lib/catalogue/ingestion/full/run-full-ingestion";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const ALLOWED_ACTIONS = new Set([
  "ingest_full",
  "ingest_full_dry_run",
]);

export async function POST(request: Request) {
  if (!isCatalogueAdminConfigured()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!isCatalogueAdminAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { action?: string; resume?: boolean };
  try {
    body = (await request.json()) as { action?: string; resume?: boolean };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const action = body.action;
  if (!action || !ALLOWED_ACTIONS.has(action)) {
    return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
  }

  const summary = await runFullCatalogueIngestion({
    dryRun: action === "ingest_full_dry_run",
    resume: body.resume ?? true,
  });

  return NextResponse.json({
    status: "completed",
    action,
    summary,
  });
}
