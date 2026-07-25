import { NextResponse } from "next/server";

import {
  isCatalogueAdminAuthorized,
  isCatalogueAdminConfigured,
} from "@/lib/catalogue/admin-auth";
import {
  inspectCurrentSchema,
  runPendingCatalogueMigrations,
} from "@/lib/catalogue/bootstrap/schema";
import { EXPECTED_MIGRATION_TAGS } from "@/lib/catalogue/bootstrap/constants";
import { getNormalizedDatabaseUrl } from "@/env";
import { runFullCatalogueIngestion } from "@/lib/catalogue/ingestion/full/run-full-ingestion";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const ALLOWED_ACTIONS = new Set([
  "migrate",
  "ingest_full",
  "ingest_full_dry_run",
  "ingest_stock",
  "ingest_catalogue",
]);

type RequestBody = {
  action?: string;
  resume?: boolean;
  runId?: string;
};

export async function POST(request: Request) {
  if (!isCatalogueAdminConfigured()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!isCatalogueAdminAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const action = body.action;
  if (!action || !ALLOWED_ACTIONS.has(action)) {
    return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
  }

  if (action === "migrate") {
    try {
      const databaseUrl = getNormalizedDatabaseUrl();
      const before = await inspectCurrentSchema(databaseUrl);
      const pendingBefore = [...before.pendingMigrationTags];

      if (pendingBefore.length > 0) {
        await runPendingCatalogueMigrations(databaseUrl);
      }

      const after = await inspectCurrentSchema(databaseUrl);

      return NextResponse.json({
        status: "completed",
        action,
        migration: {
          appliedNow: pendingBefore,
          pendingBefore,
          pendingAfter: [...after.pendingMigrationTags],
          expectedTags: [...EXPECTED_MIGRATION_TAGS],
          appliedCount: after.appliedMigrations.length,
          catalogueMigrationApplied: after.catalogueMigrationApplied,
          tables: {
            vehicleModelSpecifications: after.existingTables.includes(
              "vehicle_model_specifications",
            ),
            vehicleOffersModelId: after.existingTables.includes("vehicle_offers"),
          },
        },
      });
    } catch {
      return NextResponse.json(
        {
          status: "failed",
          action,
          error: "Migration failed",
        },
        { status: 500 },
      );
    }
  }

  const summary = await runFullCatalogueIngestion({
    dryRun: action === "ingest_full_dry_run",
    resume: body.resume ?? true,
    runId: body.runId,
    stockOnly: action === "ingest_stock",
    skipStock: action === "ingest_catalogue",
  });

  return NextResponse.json({
    status: summary.status,
    action,
    summary,
  });
}
