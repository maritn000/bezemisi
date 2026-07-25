import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";

import {
  isCatalogueAdminAuthorized,
  isCatalogueAdminConfigured,
} from "@/lib/catalogue/admin-auth";
import { countCatalogueStats } from "@/lib/catalogue/repositories/catalogue-repository";
import { validateCatalogue } from "@/lib/catalogue/validation";
import { createDb } from "@/db/create-client";
import { getNormalizedDatabaseUrl } from "@/env";
import { catalogueIngestionIssues, catalogueIngestionRuns } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isCatalogueAdminConfigured()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!isCatalogueAdminAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = createDb(getNormalizedDatabaseUrl());

  const [stats, validation, runs, issues] = await Promise.all([
    countCatalogueStats(),
    validateCatalogue(),
    db
      .select()
      .from(catalogueIngestionRuns)
      .orderBy(desc(catalogueIngestionRuns.startedAt))
      .limit(10),
    db
      .select()
      .from(catalogueIngestionIssues)
      .orderBy(desc(catalogueIngestionIssues.createdAt))
      .limit(50),
  ]);

  return NextResponse.json({
    stats,
    validation,
    rangeMetrics: validation.rangeMetrics,
    runs,
    issues,
  });
}
