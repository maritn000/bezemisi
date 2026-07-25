import { eq } from "drizzle-orm";

import { createDb } from "@/db/create-client";
import { getNormalizedDatabaseUrl } from "@/env";
import { catalogueIngestionRuns, vehicleBrands, vehicleModels } from "@/db/schema";
import { BEZEMISI_BASE_URL } from "@/lib/catalogue/constants";
import { VERIFIED_VARIANT_SEEDS } from "@/lib/catalogue/ingestion/seed-data";
import { crawlUrl } from "@/lib/catalogue/ingestion/crawl/crawler";
import {
  discoverCatalogueUrls,
  parseCataloguePage,
} from "@/lib/catalogue/ingestion/crawl/catalogue-parser";
import { parseModelDetailPage } from "@/lib/catalogue/ingestion/crawl/model-page-parser";
import {
  discoverActionOfferUrls,
  parseActionOfferPage,
} from "@/lib/catalogue/ingestion/crawl/offer-parser";
import {
  discoverLeasingUrls,
  parseLeasingPage,
} from "@/lib/catalogue/ingestion/crawl/leasing-parser";
import {
  discoverStockUrls,
  parseStockDetailPage,
} from "@/lib/catalogue/ingestion/crawl/stock-parser";
import { downloadVehicleImage } from "@/lib/catalogue/ingestion/images/download-images";
import {
  loadIngestionManifest,
  saveIngestionManifest,
} from "@/lib/catalogue/ingestion/crawl/manifest-store";
import {
  upsertManifestEntry,
} from "@/lib/catalogue/ingestion/crawl/manifest";
import {
  recordIngestionIssue,
  seedSpecToFact,
  upsertBrandRecord,
  upsertCommercialConditionRecord,
  upsertModelRecord,
  upsertModelSpecification,
  upsertOfferRecord,
  upsertVariantRecord,
  upsertVariantSpecification,
} from "./upsert-helpers";

export type FullIngestionOptions = {
  dryRun?: boolean;
  resume?: boolean;
  runId?: string;
  skipManufacturerSupplement?: boolean;
  ingestionRunId?: string;
};

export type FullIngestionSummary = {
  runId: string;
  ingestionRunId: string;
  dryRun: boolean;
  status: "in_progress" | "completed" | "completed_with_warnings" | "failed";
  discovered: {
    catalogueModels: number;
    modelPages: number;
    actionOfferPages: number;
    stockOffers: number;
    leasingOffers: number;
    manufacturerPages: number;
  };
  stored: {
    models: number;
    variants: number;
    modelFacts: number;
    variantFacts: number;
    offers: number;
    leasingConditions: number;
    imagesDownloaded: number;
  };
  warningsCount: number;
  errorsCount: number;
  blockedUrls: string[];
};

const CATALOGUE_ROOT = `${BEZEMISI_BASE_URL}/elektromobily`;
const ACTION_ROOT = `${BEZEMISI_BASE_URL}/akcni-nabidky`;
const LEASING_ROOT = `${BEZEMISI_BASE_URL}/operativni-leasing`;
const STOCK_ROOT = "https://auto.bezemisi.cz/nabidka-vozu/";
const STOCK_BATCH_SIZE = 35;

type PersistedIngestionState = {
  summary?: FullIngestionSummary;
  stockPageIndex?: number;
  stockUrls?: string[];
  phasesComplete?: string[];
};

async function loadModelRegistryFromDb(
  db: NonNullable<ReturnType<typeof createDb>>,
) {
  const joined = await db
    .select({
      modelId: vehicleModels.id,
      modelSlug: vehicleModels.slug,
      brandSlug: vehicleBrands.slug,
    })
    .from(vehicleModels)
    .innerJoin(vehicleBrands, eq(vehicleModels.brandId, vehicleBrands.id));

  const registry = new Map<
    string,
    { brandSlug: string; modelSlug: string; modelId: string; detailUrl: string | null }
  >();

  for (const row of joined) {
    registry.set(modelKey(row.brandSlug, row.modelSlug), {
      brandSlug: row.brandSlug,
      modelSlug: row.modelSlug,
      modelId: row.modelId,
      detailUrl: null,
    });
  }

  return registry;
}

function modelKey(brandSlug: string, modelSlug: string) {
  return `${brandSlug}/${modelSlug}`;
}

function matchModelByText(
  models: Map<string, { brandSlug: string; modelSlug: string; modelId: string }>,
  text: string,
) {
  const normalized = text.toLowerCase();
  for (const [key, value] of models) {
    if (normalized.includes(value.modelSlug.replace(/-/g, " "))) {
      return value;
    }
    if (normalized.includes(key.replace("/", " "))) {
      return value;
    }
  }
  return null;
}

export async function runFullCatalogueIngestion(
  options: FullIngestionOptions = {},
): Promise<FullIngestionSummary> {
  const dryRun = options.dryRun ?? false;
  const resume = options.resume ?? true;
  const runId = options.runId ?? `full-${Date.now()}`;
  const observedAt = new Date();

  const summary: FullIngestionSummary = {
    runId,
    ingestionRunId: "dry-run",
    dryRun,
    status: "in_progress",
    discovered: {
      catalogueModels: 0,
      modelPages: 0,
      actionOfferPages: 0,
      stockOffers: 0,
      leasingOffers: 0,
      manufacturerPages: 0,
    },
    stored: {
      models: 0,
      variants: 0,
      modelFacts: 0,
      variantFacts: 0,
      offers: 0,
      leasingConditions: 0,
      imagesDownloaded: 0,
    },
    warningsCount: 0,
    errorsCount: 0,
    blockedUrls: [],
  };

  const db = dryRun ? null : createDb(getNormalizedDatabaseUrl());

  let ingestionRunId = options.ingestionRunId ?? "dry-run";
  let stockPageIndex = 0;
  let stockUrlList: string[] | null = null;
  let resumeAtStock = false;

  if (!dryRun && db) {
    if (resume && ingestionRunId === "dry-run") {
      const [existingRun] = await db
        .select()
        .from(catalogueIngestionRuns)
        .where(eq(catalogueIngestionRuns.status, "running"))
        .limit(1);

      if (existingRun) {
        ingestionRunId = existingRun.id;
        const rawMetadata = existingRun.metadata as
          | PersistedIngestionState
          | FullIngestionSummary
          | null;
        const persisted: PersistedIngestionState =
          rawMetadata &&
          "discovered" in rawMetadata &&
          "stored" in rawMetadata &&
          !("summary" in rawMetadata)
            ? { summary: rawMetadata }
            : (rawMetadata as PersistedIngestionState) ?? {};
        if (persisted.summary) {
          Object.assign(summary, persisted.summary);
        }
        stockPageIndex = persisted.stockPageIndex ?? 0;
        stockUrlList = persisted.stockUrls ?? null;
        resumeAtStock = Boolean(
          (persisted.stockPageIndex ?? 0) > 0 ||
            (persisted.stockUrls?.length ?? 0) > 0 ||
            ((persisted.summary?.discovered?.catalogueModels ?? 0) > 0 &&
              (persisted.summary?.stored?.models ?? 0) > 0),
        );
      }
    }

    if (ingestionRunId === "dry-run") {
      const [run] = await db
        .insert(catalogueIngestionRuns)
        .values({
          runType: "full_crawl",
          status: "running",
          startedAt: observedAt,
        })
        .returning();
      ingestionRunId = run!.id;
    }
    summary.ingestionRunId = ingestionRunId;
  }

  const manifest = await loadIngestionManifest(runId, ingestionRunId);
  const crawlOptions = { runId, manifest, resume };

  const modelRegistry = resumeAtStock && db
    ? await loadModelRegistryFromDb(db)
    : new Map<
        string,
        { brandSlug: string; modelSlug: string; modelId: string; detailUrl: string | null }
      >();

  try {
    if (!resumeAtStock) {
    const catalogueCrawl = await crawlUrl(
      CATALOGUE_ROOT,
      "catalogue_root",
      crawlOptions,
    );
    if (!catalogueCrawl.html) {
      summary.errorsCount += 1;
      summary.blockedUrls.push(CATALOGUE_ROOT);
    }

    const catalogueCards = parseCataloguePage(catalogueCrawl.html);
    summary.discovered.catalogueModels = catalogueCards.length;

    const discoveredUrls = discoverCatalogueUrls(catalogueCrawl.html);
    const modelPageUrls = discoveredUrls.filter((url) =>
      /\/elektromobily\/[^/]+\/[^/]+$/.test(url),
    );
    const brandPageUrls = discoveredUrls.filter(
      (url) =>
        /\/elektromobily\/[^/]+$/.test(url) && !url.endsWith("/elektromobily"),
    );

    if (!dryRun && db) {
      for (const card of catalogueCards) {
        const brand = await upsertBrandRecord(db, card.brandSlug, card.brandName);
        const model = await upsertModelRecord(db, {
          brandId: brand.id,
          modelName: card.modelName,
          modelSlug: card.modelSlug,
          category: card.category,
          description: card.marketingDescription,
        });
        summary.stored.models += 1;
        modelRegistry.set(modelKey(card.brandSlug, card.modelSlug), {
          brandSlug: card.brandSlug,
          modelSlug: card.modelSlug,
          modelId: model.id,
          detailUrl: card.detailUrl,
        });

        const sourceUrl = card.detailUrl ?? CATALOGUE_ROOT;
        const sourceTitle = `${card.modelName} – katalog Bez emisí`;

        const modelFacts = [
          card.maxWltpRangeKm != null
            ? {
                fieldKey: "published_model_max_wltp_range_km",
                value: card.maxWltpRangeKm,
                unit: "km",
                notes: "Katalogový marketingový maximální dojezd (až)",
              }
            : null,
          card.startingPriceCzk != null
            ? {
                fieldKey: "published_starting_price_czk",
                value: card.startingPriceCzk,
                unit: "CZK",
              }
            : null,
          card.priceUnavailable
            ? {
                fieldKey: "published_price_unavailable",
                value: true,
              }
            : null,
          card.operatingCostMinCzkPer100km != null
            ? {
                fieldKey: "published_operating_cost_min_czk_per_100km",
                value: card.operatingCostMinCzkPer100km,
                unit: "CZK/100km",
              }
            : null,
          card.operatingCostMaxCzkPer100km != null
            ? {
                fieldKey: "published_operating_cost_max_czk_per_100km",
                value: card.operatingCostMaxCzkPer100km,
                unit: "CZK/100km",
              }
            : null,
          card.vatStatus
            ? {
                fieldKey: "published_vat_status",
                value: card.vatStatus,
              }
            : null,
          card.marketingDescription
            ? {
                fieldKey: "published_marketing_description",
                value: card.marketingDescription,
              }
            : null,
        ].filter(Boolean) as Array<{
          fieldKey: string;
          value: number | string | boolean;
          unit?: string;
          notes?: string;
        }>;

        for (const fact of modelFacts) {
          const result = await upsertModelSpecification(
            db,
            model.id,
            {
              ...fact,
              sourceUrl,
              sourceTitle,
              sourceAuthority: "primary_bezemisi",
              sourceType: "bezemisi_vehicle_page",
              contentHash: catalogueCrawl.entry.contentHash ?? undefined,
              httpStatus: catalogueCrawl.entry.httpStatus ?? undefined,
            },
            observedAt,
            { skipIfVerifiedExists: true },
          );
          if (result.action === "created") summary.stored.modelFacts += 1;
          if (result.action === "updated") summary.stored.modelFacts += 1;
        }

        if (card.imageUrl) {
          const image = await downloadVehicleImage({
            sourceUrl: card.imageUrl,
            brandSlug: card.brandSlug,
            modelSlug: card.modelSlug,
            filename: "catalogue-card.jpg",
          });
          if (image && !image.reused) summary.stored.imagesDownloaded += 1;
          if (image) {
            await upsertModelRecord(db, {
              brandId: brand.id,
              modelName: card.modelName,
              modelSlug: card.modelSlug,
              mainImagePath: image.localPath,
            });
          }
        } else {
          summary.warningsCount += 1;
          await recordIngestionIssue(db, ingestionRunId, {
            entityType: "vehicle_model",
            entityIdentifier: modelKey(card.brandSlug, card.modelSlug),
            issueType: "missing_image",
            message: "Katalogový obrázek modelu nebyl nalezen.",
          });
        }
      }
    }

    for (const brandUrl of brandPageUrls) {
      await crawlUrl(brandUrl, "brand_page", crawlOptions, CATALOGUE_ROOT);
    }

    for (const modelUrl of modelPageUrls) {
      const crawl = await crawlUrl(modelUrl, "model_page", crawlOptions, CATALOGUE_ROOT);
      if (!crawl.html) {
        summary.blockedUrls.push(modelUrl);
        continue;
      }
      summary.discovered.modelPages += 1;

      const parts = modelUrl.replace(/\/$/, "").split("/");
      const modelSlug = parts.at(-1)!;
      const brandSlug = parts.at(-2)!;

      const parsed = parseModelDetailPage(crawl.html, modelUrl);
      if (!dryRun && db) {
        const brand = await upsertBrandRecord(
          db,
          brandSlug,
          brandSlug.charAt(0).toUpperCase() + brandSlug.slice(1),
        );
        const model = await upsertModelRecord(db, {
          brandId: brand.id,
          modelName: parsed.title,
          modelSlug,
          description: parsed.description,
        });
        modelRegistry.set(modelKey(brandSlug, modelSlug), {
          brandSlug,
          modelSlug,
          modelId: model.id,
          detailUrl: modelUrl,
        });

        if (parsed.heroImageUrl) {
          const image = await downloadVehicleImage({
            sourceUrl: parsed.heroImageUrl,
            brandSlug,
            modelSlug,
            filename: "hero.jpg",
          });
          if (image && !image.reused) summary.stored.imagesDownloaded += 1;
          if (image) {
            await upsertModelRecord(db, {
              brandId: brand.id,
              modelName: parsed.title,
              modelSlug,
              mainImagePath: image.localPath,
            });
          }
        }

        for (const fact of parsed.modelFacts.filter((f) => f.scope === "model")) {
          const result = await upsertModelSpecification(
            db,
            model.id,
            {
              fieldKey: fact.fieldKey,
              value: fact.value,
              unit: fact.unit,
              notes: fact.notes,
              sourceUrl: modelUrl,
              sourceTitle: `${parsed.title} – Bez emisí`,
              sourceAuthority: "primary_bezemisi",
              sourceType: "bezemisi_vehicle_page",
              contentHash: crawl.entry.contentHash ?? undefined,
            },
            observedAt,
            { skipIfVerifiedExists: true },
          );
          if (result.action !== "skipped") summary.stored.modelFacts += 1;
        }

        for (const variant of parsed.variants) {
          const variantRow = await upsertVariantRecord(db, {
            modelId: model.id,
            slug: variant.slug || "variant",
            name: variant.label,
            trimName: variant.trimName,
            batteryVariant: variant.batteryVariant,
          });
          summary.stored.variants += 1;

          for (const fact of variant.facts) {
            const result = await upsertVariantSpecification(
              db,
              variantRow.id,
              {
                fieldKey: fact.fieldKey,
                value: fact.value,
                unit: fact.unit,
                notes: fact.notes,
                sourceUrl: modelUrl,
                sourceTitle: `${parsed.title} – ${variant.label}`,
                sourceAuthority: "primary_bezemisi",
                sourceType: "bezemisi_vehicle_page",
              },
              observedAt,
              { skipIfVerifiedExists: true },
            );
            if (result.action !== "skipped") summary.stored.variantFacts += 1;
          }

          if (variant.startingPriceCzk != null) {
            const offer = await upsertOfferRecord(db, {
              variantId: variantRow.id,
              externalOfferId: `${variantRow.id}:trim-price`,
              title: `${parsed.title} – ${variant.label}`,
              offerType: "trim_price",
              currentPrice: variant.startingPriceCzk,
              listPrice: variant.startingPriceCzk,
              sourceUrl: modelUrl,
              sourceTitle: `${parsed.title} – ${variant.label}`,
              observedAt,
            });
            if (offer.action === "created") summary.stored.offers += 1;
          }
        }

        const seed = VERIFIED_VARIANT_SEEDS.find(
          (entry) =>
            entry.brandSlug === brandSlug && entry.modelSlug === modelSlug,
        );
        if (seed) {
          for (const variantSeed of seed.variants) {
            const variantRow = await upsertVariantRecord(db, {
              modelId: model.id,
              slug: variantSeed.slug,
              name: variantSeed.name,
              trimName: variantSeed.trimName,
              batteryVariant: variantSeed.batteryVariant,
              drivetrain: variantSeed.drivetrain,
              modelYear: variantSeed.modelYear,
            });
            for (const spec of variantSeed.specs) {
              const result = await upsertVariantSpecification(
                db,
                variantRow.id,
                seedSpecToFact(spec),
                observedAt,
                { skipIfVerifiedExists: true },
              );
              if (result.action !== "skipped") summary.stored.variantFacts += 1;
            }
            if (variantSeed.listPrice) {
              await upsertOfferRecord(db, {
                variantId: variantRow.id,
                externalOfferId: `${variantRow.id}:list-price`,
                title:
                  variantSeed.offerTitle ?? `${parsed.title} – cena od`,
                offerType: "list_price",
                currentPrice: variantSeed.listPrice,
                listPrice: variantSeed.listPrice,
                sourceUrl: modelUrl,
                sourceTitle: `${parsed.title} – Bez emisí`,
                observedAt,
              });
            }
          }
        }
      }

      upsertManifestEntry(manifest, {
        ...crawl.entry,
        parseStatus: "parsed",
        factsFound: parsed.modelFacts.length + parsed.variants.length,
        imagesFound: parsed.imageUrls.length,
      });
    }

    const actionCrawl = await crawlUrl(
      ACTION_ROOT,
      "action_offer_list",
      crawlOptions,
    );
    const actionUrls = discoverActionOfferUrls(actionCrawl.html);
    for (const offerUrl of actionUrls) {
      if (offerUrl === ACTION_ROOT) continue;
      const crawl = await crawlUrl(
        offerUrl,
        "action_offer_detail",
        crawlOptions,
        ACTION_ROOT,
      );
      if (!crawl.html) continue;
      summary.discovered.actionOfferPages += 1;
      const parsed = parseActionOfferPage(crawl.html, offerUrl);
      if (!parsed || dryRun || !db) continue;

      const matched = matchModelByText(modelRegistry, parsed.title);
      const availabilityStatus = parsed.soldOut
        ? "sold"
        : /skladem|ihned/i.test(parsed.availabilityText ?? "")
          ? "available"
          : "unknown";

      if (matched) {
        await upsertOfferRecord(db, {
          modelId: matched.modelId,
          externalOfferId: `action:${offerUrl}`,
          title: parsed.title,
          offerUrl,
          offerType: "action_price",
          listPrice: parsed.listPrice,
          currentPrice: parsed.actionPrice,
          availabilityStatus,
          availabilityText: parsed.availabilityText ?? undefined,
          sourceUrl: offerUrl,
          sourceTitle: parsed.title,
          observedAt,
        });
        summary.stored.offers += 1;
      } else {
        summary.warningsCount += 1;
        await recordIngestionIssue(db, ingestionRunId, {
          entityType: "vehicle_offer",
          entityIdentifier: offerUrl,
          issueType: "model_mapping_uncertain",
          message:
            "Akční nabídka nebyla spolehlivě přiřazena k modelu – uložena jako obecná nabídka.",
        });
      }
    }

    const leasingCrawl = await crawlUrl(
      LEASING_ROOT,
      "leasing_list",
      crawlOptions,
    );
    const leasingUrls = discoverLeasingUrls(leasingCrawl.html);
    for (const leasingUrl of leasingUrls) {
      const crawl = await crawlUrl(
        leasingUrl,
        "leasing_detail",
        crawlOptions,
        LEASING_ROOT,
      );
      if (!crawl.html) continue;
      const offers = parseLeasingPage(crawl.html, leasingUrl);
      summary.discovered.leasingOffers += offers.length;
      if (dryRun || !db) continue;

      for (const offer of offers) {
        await upsertCommercialConditionRecord(db, {
          conditionType: "operating_lease",
          title: offer.title,
          content: [
            offer.monthlyPaymentExVat != null
              ? `Měsíční splátka bez DPH: ${offer.monthlyPaymentExVat} Kč`
              : null,
            offer.monthlyPaymentIncVat != null
              ? `Měsíční splátka včetně DPH: ${offer.monthlyPaymentIncVat} Kč`
              : null,
            offer.mileageAllowanceKm != null
              ? `Roční limit: ${offer.mileageAllowanceKm} km`
              : null,
            offer.contractDurationMonths != null
              ? `Doba splácení: ${offer.contractDurationMonths} měsíců`
              : null,
          ]
            .filter(Boolean)
            .join("\n"),
          structuredValue: {
            monthlyPaymentExVat: offer.monthlyPaymentExVat,
            monthlyPaymentIncVat: offer.monthlyPaymentIncVat,
            mileageAllowanceKm: offer.mileageAllowanceKm,
            contractDurationMonths: offer.contractDurationMonths,
            modelLabel: offer.modelLabel,
          },
          sourceUrl: leasingUrl,
          sourceTitle: offer.title,
          observedAt,
        });
        summary.stored.leasingConditions += 1;
      }
    }
    }

    if (!stockUrlList) {
      const stockCrawl = await crawlUrl(STOCK_ROOT, "stock_list", crawlOptions);
      const stockUrls = new Set<string>(discoverStockUrls(stockCrawl.html));
      for (const listUrl of stockUrls) {
        if (!listUrl.endsWith(".html")) {
          const listCrawl = await crawlUrl(
            listUrl,
            "stock_list",
            crawlOptions,
            STOCK_ROOT,
          );
          for (const detailUrl of discoverStockUrls(listCrawl.html)) {
            stockUrls.add(detailUrl);
          }
        }
      }
      stockUrlList = [...stockUrls].filter((url) => url.endsWith(".html"));

      if (!dryRun && db) {
        await db
          .update(catalogueIngestionRuns)
          .set({
            metadata: {
              summary,
              stockPageIndex,
              stockUrls: stockUrlList,
              phasesComplete: ["pre_stock"],
            },
            updatedAt: new Date(),
          })
          .where(eq(catalogueIngestionRuns.id, ingestionRunId));
      }
      await saveIngestionManifest(manifest, runId, ingestionRunId);
    }

    const stockBatch = stockUrlList.slice(
      stockPageIndex,
      stockPageIndex + STOCK_BATCH_SIZE,
    );

    for (const stockUrl of stockBatch) {
      const crawl = await crawlUrl(
        stockUrl,
        "stock_detail",
        crawlOptions,
        STOCK_ROOT,
      );
      if (!crawl.html) continue;
      const parsed = parseStockDetailPage(crawl.html, stockUrl);
      if (!parsed) continue;
      summary.discovered.stockOffers += 1;
      if (dryRun || !db) continue;

      const matched = matchModelByText(
        modelRegistry,
        `${parsed.brandName ?? ""} ${parsed.modelName ?? ""}`,
      );

      const availabilityStatus = /prodáno|rezervováno/i.test(
        parsed.availabilityText ?? "",
      )
        ? "reserved"
        : /skladem|ihned/i.test(parsed.availabilityText ?? "")
          ? "available"
          : "unknown";

      if (matched) {
        await upsertOfferRecord(db, {
          modelId: matched.modelId,
          externalOfferId: parsed.externalOfferId,
          title: parsed.title,
          offerUrl: parsed.offerUrl,
          offerType: "stock_inventory",
          listPrice: parsed.listPrice,
          currentPrice: parsed.currentPrice ?? parsed.listPrice,
          vatStatus: parsed.vatStatus ?? undefined,
          availabilityStatus,
          availabilityText: parsed.availabilityText ?? undefined,
          condition: parsed.condition,
          mileageKm: parsed.mileageKm,
          colour: parsed.colour,
          vin: parsed.vin,
          modelYear: parsed.modelYear,
          registrationYear: parsed.registrationYear,
          location: parsed.location ?? undefined,
          sourceUrl: stockUrl,
          sourceTitle: parsed.title,
          observedAt,
        });
        summary.stored.offers += 1;
      } else {
        summary.warningsCount += 1;
        await recordIngestionIssue(db, ingestionRunId, {
          entityType: "vehicle_offer",
          entityIdentifier: stockUrl,
          issueType: "model_mapping_uncertain",
          message:
            "Skladová nabídka nebyla spolehlivě přiřazena k modelu v katalogu.",
        });
      }
    }

    stockPageIndex += stockBatch.length;
    const stockComplete = stockPageIndex >= stockUrlList.length;

    await saveIngestionManifest(manifest, runId, ingestionRunId);

    if (!dryRun && db) {
      const runStatus = !stockComplete
        ? "running"
        : summary.errorsCount > 0
          ? "completed_with_warnings"
          : summary.warningsCount > 0
            ? "completed_with_warnings"
            : "completed";

      summary.status =
        runStatus === "running"
          ? "in_progress"
          : (runStatus as FullIngestionSummary["status"]);

      await db
        .update(catalogueIngestionRuns)
        .set({
          status: runStatus,
          completedAt: stockComplete ? new Date() : null,
          pagesDiscovered:
            summary.discovered.catalogueModels +
            summary.discovered.modelPages +
            summary.discovered.actionOfferPages +
            summary.discovered.stockOffers,
          pagesProcessed:
            summary.discovered.modelPages + summary.discovered.catalogueModels,
          modelsCreated: summary.stored.models,
          variantsCreated: summary.stored.variants,
          factsCreated: summary.stored.modelFacts + summary.stored.variantFacts,
          offersCreated: summary.stored.offers,
          warningsCount: summary.warningsCount,
          errorsCount: summary.errorsCount,
          metadata: {
            summary,
            stockPageIndex,
            stockUrls: stockUrlList,
            phasesComplete: stockComplete
              ? ["pre_stock", "stock"]
              : resumeAtStock
                ? ["pre_stock"]
                : ["pre_stock"],
          },
          updatedAt: new Date(),
        })
        .where(eq(catalogueIngestionRuns.id, ingestionRunId));
    } else if (stockComplete) {
      summary.status = "completed";
    }
  } catch (error) {
    summary.errorsCount += 1;
    summary.status = "failed";
    if (!dryRun && db) {
      await db
        .update(catalogueIngestionRuns)
        .set({
          status: "failed",
          completedAt: new Date(),
          errorsCount: summary.errorsCount,
          metadata: {
            error: error instanceof Error ? error.message : "unknown",
            summary,
          },
          updatedAt: new Date(),
        })
        .where(eq(catalogueIngestionRuns.id, ingestionRunId));
    }
    throw error;
  }

  return summary;
}
