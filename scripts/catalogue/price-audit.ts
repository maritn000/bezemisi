#!/usr/bin/env tsx
import "dotenv/config";

import { config } from "dotenv";
import { eq, ilike, or, sql } from "drizzle-orm";

config({ path: ".env.local" });

import { createDb } from "@/db/create-client";
import { getDatabaseUrlSourceKey, getNormalizedDatabaseUrl } from "@/env";
import {
  sourcePages,
  vehicleBrands,
  vehicleModelSpecifications,
  vehicleModels,
  vehicleOffers,
  vehicleSpecifications,
  vehicleVariants,
} from "@/db/schema";
import { BEZEMISI_BASE_URL } from "@/lib/catalogue/constants";
import { parseCataloguePage } from "@/lib/catalogue/ingestion/crawl/catalogue-parser";
import { fetchPage } from "@/lib/catalogue/ingestion/fetch-page";
import { listPresentedModels } from "@/lib/catalogue/repositories/catalogue-repository";
import { redactDatabaseUrl, resolveDatabaseUrlFromEnv } from "@/lib/database-url";

type PriceAuditRow = {
  brand: string;
  model: string;
  variant: string | null;
  factScope: "model" | "variant" | "offer";
  fieldKey: string;
  numericValue: number | null;
  currency: string | null;
  verificationStatus: string;
  sourceTitle: string;
  sourceUrl: string | null;
  observedDate: string;
  currentStatus: string;
};

async function main() {
  const resolved = resolveDatabaseUrlFromEnv();
  const redacted = redactDatabaseUrl(resolved.url);
  const db = createDb(getNormalizedDatabaseUrl());

  const priceKeyFilter = or(
    ilike(vehicleModelSpecifications.fieldKey, "%price%"),
    ilike(vehicleModelSpecifications.fieldKey, "%cena%"),
    ilike(vehicleModelSpecifications.fieldKey, "%starting%"),
    ilike(vehicleModelSpecifications.fieldKey, "%published%"),
    ilike(vehicleSpecifications.fieldKey, "%price%"),
    ilike(vehicleSpecifications.fieldKey, "%cena%"),
    ilike(vehicleSpecifications.fieldKey, "%starting%"),
    ilike(vehicleSpecifications.fieldKey, "%published%"),
  );

  const modelPriceRows = await db
    .select({
      spec: vehicleModelSpecifications,
      page: sourcePages,
      model: vehicleModels,
      brand: vehicleBrands,
    })
    .from(vehicleModelSpecifications)
    .innerJoin(
      sourcePages,
      eq(vehicleModelSpecifications.sourcePageId, sourcePages.id),
    )
    .innerJoin(vehicleModels, eq(vehicleModelSpecifications.modelId, vehicleModels.id))
    .innerJoin(vehicleBrands, eq(vehicleModels.brandId, vehicleBrands.id))
    .where(priceKeyFilter);

  const variantPriceRows = await db
    .select({
      spec: vehicleSpecifications,
      page: sourcePages,
      variant: vehicleVariants,
      model: vehicleModels,
      brand: vehicleBrands,
    })
    .from(vehicleSpecifications)
    .innerJoin(sourcePages, eq(vehicleSpecifications.sourcePageId, sourcePages.id))
    .innerJoin(vehicleVariants, eq(vehicleSpecifications.variantId, vehicleVariants.id))
    .innerJoin(vehicleModels, eq(vehicleVariants.modelId, vehicleModels.id))
    .innerJoin(vehicleBrands, eq(vehicleModels.brandId, vehicleBrands.id))
    .where(priceKeyFilter);

  const offerRows = await db
    .select({
      offer: vehicleOffers,
      page: sourcePages,
      variant: vehicleVariants,
      model: vehicleModels,
      brand: vehicleBrands,
    })
    .from(vehicleOffers)
    .innerJoin(sourcePages, eq(vehicleOffers.sourcePageId, sourcePages.id))
    .leftJoin(vehicleVariants, eq(vehicleOffers.variantId, vehicleVariants.id))
    .leftJoin(
      vehicleModels,
      sql`${vehicleModels.id} = coalesce(${vehicleVariants.modelId}, ${vehicleOffers.modelId})`,
    )
    .leftJoin(vehicleBrands, eq(vehicleModels.brandId, vehicleBrands.id))
    .where(eq(vehicleOffers.isCurrent, true));

  const rows: PriceAuditRow[] = [];

  for (const row of modelPriceRows) {
    rows.push({
      brand: row.brand.name,
      model: row.model.name,
      variant: null,
      factScope: "model",
      fieldKey: row.spec.fieldKey,
      numericValue:
        row.spec.valueType === "number" ? Number(row.spec.numericValue) : null,
      currency: row.spec.unit,
      verificationStatus: row.spec.verificationStatus,
      sourceTitle: row.page.title,
      sourceUrl: row.page.url,
      observedDate: String(row.spec.observedAt ?? row.page.retrievedAt ?? ""),
      currentStatus: row.spec.verificationStatus,
    });
  }

  for (const row of variantPriceRows) {
    rows.push({
      brand: row.brand.name,
      model: row.model.name,
      variant: row.variant.name,
      factScope: "variant",
      fieldKey: row.spec.fieldKey,
      numericValue:
        row.spec.valueType === "number" ? Number(row.spec.numericValue) : null,
      currency: row.spec.unit,
      verificationStatus: row.spec.verificationStatus,
      sourceTitle: row.page.title,
      sourceUrl: row.page.url,
      observedDate: String(row.spec.observedAt ?? row.page.retrievedAt ?? ""),
      currentStatus: row.spec.verificationStatus,
    });
  }

  for (const row of offerRows) {
    rows.push({
      brand: row.brand?.name ?? "unknown",
      model: row.model?.name ?? row.offer.title,
      variant: row.variant?.name ?? null,
      factScope: "offer",
      fieldKey: "current_price",
      numericValue: row.offer.currentPrice ? Number(row.offer.currentPrice) : null,
      currency: row.offer.currency,
      verificationStatus: row.offer.isCurrent ? "current" : "stale",
      sourceTitle: row.page.title,
      sourceUrl: row.page.url,
      observedDate: String(row.offer.observedAt ?? ""),
      currentStatus: row.offer.isCurrent ? "current" : "not_current",
    });
    if (row.offer.listPrice) {
      rows.push({
        brand: row.brand?.name ?? "unknown",
        model: row.model?.name ?? row.offer.title,
        variant: row.variant?.name ?? null,
        factScope: "offer",
        fieldKey: "list_price",
        numericValue: Number(row.offer.listPrice),
        currency: row.offer.currency,
        verificationStatus: row.offer.isCurrent ? "current" : "stale",
        sourceTitle: row.page.title,
        sourceUrl: row.page.url,
        observedDate: String(row.offer.observedAt ?? ""),
        currentStatus: row.offer.isCurrent ? "current" : "not_current",
      });
    }
  }

  const models = await listPresentedModels();
  const verifiedModelStartingPrices = rows.filter(
    (row) =>
      row.factScope === "model" &&
      row.fieldKey === "published_starting_price_czk" &&
      row.verificationStatus === "verified",
  );
  const verifiedVariantPrices = rows.filter(
    (row) =>
      row.factScope === "variant" &&
      row.verificationStatus === "verified" &&
      row.numericValue !== null,
  );
  const currentOfferPrices = rows.filter(
    (row) => row.factScope === "offer" && row.fieldKey === "current_price",
  );
  const unavailableModels = rows.filter(
    (row) =>
      row.factScope === "model" &&
      row.fieldKey === "published_price_unavailable" &&
      row.verificationStatus === "verified",
  );

  const cataloguePage = await fetchPage(`${BEZEMISI_BASE_URL}/elektromobily`);
  const publicCards = parseCataloguePage(cataloguePage.html);
  const storedStartingBySlug = new Map<string, number | null>();
  for (const row of verifiedModelStartingPrices) {
    const model = models.find(
      (entry) =>
        entry.brand.name === row.brand && entry.model.name === row.model,
    );
    if (model) {
      storedStartingBySlug.set(
        `${model.brand.slug}/${model.model.slug}`,
        row.numericValue,
      );
    }
  }

  const discrepancies = publicCards
    .map((card) => {
      const key = `${card.brandSlug}/${card.modelSlug}`;
      const stored = storedStartingBySlug.get(key);
      const publicPrice = card.priceUnavailable ? null : card.startingPriceCzk;
      const mismatch =
        publicPrice !== null && stored !== publicPrice
          ? "public_price_not_stored_or_differs"
          : publicPrice !== null && stored === undefined
            ? "public_price_missing_in_db"
            : card.priceUnavailable && stored !== null
              ? "stored_price_but_public_unavailable"
              : null;
      return {
        brand: card.brandName,
        model: card.modelName,
        slug: key,
        publicPrice,
        storedPrice: stored ?? null,
        publicUnavailable: card.priceUnavailable,
        mismatch,
      };
    })
    .filter((row) => row.mismatch);

  console.log(
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        database: {
          sourceKey: getDatabaseUrlSourceKey(),
          host: redacted.host,
          name: redacted.database,
        },
        counts: {
          verifiedModelStartingPrices: verifiedModelStartingPrices.length,
          verifiedVariantPrices: verifiedVariantPrices.length,
          currentOfferPrices: currentOfferPrices.length,
          unavailableModels: unavailableModels.length,
          publicCardsWithPrice: publicCards.filter(
            (card) => card.startingPriceCzk !== null,
          ).length,
          discrepancies: discrepancies.length,
        },
        fieldKeys: [...new Set(rows.map((row) => row.fieldKey))].sort(),
        rows,
        discrepancies,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error("Price audit failed", error);
  process.exitCode = 1;
});
