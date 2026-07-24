import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";

import { countCatalogueStats } from "@/lib/catalogue/repositories/catalogue-repository";
import { validateCatalogue } from "@/lib/catalogue/validation";
import { createDb } from "@/db/create-client";
import { getNormalizedDatabaseUrl } from "@/env";
import { catalogueIngestionIssues, catalogueIngestionRuns } from "@/db/schema";

export const dynamic = "force-dynamic";

function isAuthorized(request: Request) {
  const token = process.env.CATALOGUE_ADMIN_TOKEN;
  if (!token) return false;
  const header = request.headers.get("authorization");
  return header === `Bearer ${token}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
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
    runs,
    issues,
  });
}
