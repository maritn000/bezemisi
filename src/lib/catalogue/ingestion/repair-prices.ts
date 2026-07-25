import { and, eq } from "drizzle-orm";

import { createDb } from "@/db/create-client";
import {
  catalogueIngestionRuns,
  vehicleBrands,
  vehicleModels,
} from "@/db/schema";
import { getNormalizedDatabaseUrl } from "@/env";
import { BEZEMISI_BASE_URL } from "../constants";
import { fetchPage } from "./fetch-page";
import {
  discoverCatalogueUrls,
  parseCataloguePage,
} from "./crawl/catalogue-parser";
import { parseModelDetailPage } from "./crawl/model-page-parser";
import { upsertModelSpecification } from "./full/upsert-helpers";

export type PriceRepairSummary = {
  runId: string;
  dryRun: boolean;
  modelsProcessed: number;
  startingPricesCreated: number;
  startingPricesUpdated: number;
  unavailableStatusesCreated: number;
  unavailableStatusesUpdated: number;
  skippedNoChange: number;
  warningsCount: number;
};

const CATALOGUE_ROOT = `${BEZEMISI_BASE_URL}/elektromobily`;

let repairDb: ReturnType<typeof createDb> | null = null;

function getRepairDb() {
  if (!repairDb) {
    repairDb = createDb(getNormalizedDatabaseUrl());
  }
  return repairDb;
}

export async function runPriceRepair(options: {
  dryRun?: boolean;
} = {}): Promise<PriceRepairSummary> {
  const dryRun = options.dryRun ?? false;
  const summary: PriceRepairSummary = {
    runId: dryRun ? "dry-run" : "",
    dryRun,
    modelsProcessed: 0,
    startingPricesCreated: 0,
    startingPricesUpdated: 0,
    unavailableStatusesCreated: 0,
    unavailableStatusesUpdated: 0,
    skippedNoChange: 0,
    warningsCount: 0,
  };

  const cataloguePage = await fetchPage(CATALOGUE_ROOT);
  const catalogueCards = parseCataloguePage(cataloguePage.html);
  const detailUrls = discoverCatalogueUrls(cataloguePage.html).filter((url) =>
    /\/elektromobily\/[^/]+\/[^/]+$/.test(url),
  );

  const detailPages = new Map<string, ReturnType<typeof parseModelDetailPage>>();
  for (const url of detailUrls) {
    try {
      const page = await fetchPage(url);
      detailPages.set(url, parseModelDetailPage(page.html, url));
    } catch {
      summary.warningsCount += 1;
    }
  }

  if (dryRun) {
    summary.modelsProcessed = catalogueCards.length;
    for (const card of catalogueCards) {
      if (card.startingPriceCzk !== null) {
        summary.startingPricesCreated += 1;
      } else if (card.priceUnavailable) {
        summary.unavailableStatusesCreated += 1;
      }
    }
    return summary;
  }

  const db = getRepairDb();
  const [run] = await db
    .insert(catalogueIngestionRuns)
    .values({
      runType: "price_repair",
      status: "running",
      startedAt: new Date(),
    })
    .returning();

  summary.runId = run!.id;
  const observedAt = new Date();

  try {
    for (const card of catalogueCards) {
      const [brand] = await db
        .select()
        .from(vehicleBrands)
        .where(eq(vehicleBrands.slug, card.brandSlug))
        .limit(1);
      if (!brand) continue;

      const [model] = await db
        .select()
        .from(vehicleModels)
        .where(
          and(
            eq(vehicleModels.brandId, brand.id),
            eq(vehicleModels.slug, card.modelSlug),
          ),
        )
        .limit(1);
      if (!model) continue;

      summary.modelsProcessed += 1;
      const sourceUrl = card.detailUrl ?? CATALOGUE_ROOT;
      const sourceTitle = `${card.modelName} – katalog Bez emisí`;
      const detail = card.detailUrl ? detailPages.get(card.detailUrl) : null;
      const detailPrice = detail?.modelFacts.find(
        (fact) => fact.fieldKey === "published_starting_price_czk",
      );
      const detailUnavailable = detail?.modelFacts.find(
        (fact) => fact.fieldKey === "published_price_unavailable",
      );

      const priceValue = detailPrice?.value ?? card.startingPriceCzk;
      const unavailable =
        detailUnavailable?.value === true || card.priceUnavailable;

      if (typeof priceValue === "number") {
        await upsertModelSpecification(
          db,
          model.id,
          {
            fieldKey: "published_starting_price_czk",
            value: priceValue,
            unit: "CZK",
            sourceUrl,
            sourceTitle,
            sourceAuthority: "primary_bezemisi",
            sourceType: "bezemisi_vehicle_page",
            notes: "Selective price repair from live catalogue",
          },
          observedAt,
        );
        summary.startingPricesUpdated += 1;
        continue;
      }

      if (unavailable) {
        await upsertModelSpecification(
          db,
          model.id,
          {
            fieldKey: "published_price_unavailable",
            value: true,
            sourceUrl,
            sourceTitle,
            sourceAuthority: "primary_bezemisi",
            sourceType: "bezemisi_vehicle_page",
            notes: "Selective price repair from live catalogue",
          },
          observedAt,
        );
        summary.unavailableStatusesUpdated += 1;
        continue;
      }

      summary.skippedNoChange += 1;
    }

    await db
      .update(catalogueIngestionRuns)
      .set({
        status:
          summary.warningsCount > 0 ? "completed_with_warnings" : "completed",
        completedAt: new Date(),
        factsUpdated:
          summary.startingPricesUpdated + summary.unavailableStatusesUpdated,
        warningsCount: summary.warningsCount,
        updatedAt: new Date(),
        metadata: {
          modelsProcessed: summary.modelsProcessed,
          skippedNoChange: summary.skippedNoChange,
        },
      })
      .where(eq(catalogueIngestionRuns.id, summary.runId));
  } catch (error) {
    await db
      .update(catalogueIngestionRuns)
      .set({
        status: "failed",
        completedAt: new Date(),
        errorsCount: 1,
        updatedAt: new Date(),
        metadata: {
          error: error instanceof Error ? error.message : "unknown",
        },
      })
      .where(eq(catalogueIngestionRuns.id, summary.runId));
    throw error;
  }

  return summary;
}
