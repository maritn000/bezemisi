import { and, eq } from "drizzle-orm";

import { createDb } from "@/db/create-client";
import { getNormalizedDatabaseUrl } from "@/env";
import {
  catalogueIngestionIssues,
  catalogueIngestionRuns,
  commercialConditions,
  sourcePages,
  vehicleBrands,
  vehicleModels,
  vehicleOffers,
  vehicleSpecifications,
  vehicleVariants,
} from "@/db/schema";

import {
  COMMERCIAL_CONDITION_SEEDS,
  VERIFIED_VARIANT_SEEDS,
  type SeedSpec,
} from "./seed-data";
import { detectSpecConflict } from "./conflict-detection";
import { DISCOVERED_CATALOGUE_MODELS } from "./discovery";

export type IngestionOptions = {
  dryRun?: boolean;
};

export type IngestionSummary = {
  runId: string;
  dryRun: boolean;
  pagesDiscovered: number;
  pagesProcessed: number;
  modelsCreated: number;
  variantsCreated: number;
  factsCreated: number;
  factsUpdated: number;
  offersCreated: number;
  offersUpdated: number;
  warningsCount: number;
  errorsCount: number;
};

const OBSERVED_AT = new Date("2026-07-24T12:00:00.000Z");

let ingestionDb: ReturnType<typeof createDb> | null = null;

function getIngestionDb() {
  if (!ingestionDb) {
    ingestionDb = createDb(getNormalizedDatabaseUrl());
  }
  return ingestionDb;
}

async function upsertSourcePage(spec: SeedSpec) {
  const db = getIngestionDb();
  const [existing] = await db
    .select()
    .from(sourcePages)
    .where(eq(sourcePages.url, spec.sourceUrl))
    .limit(1);

  if (existing) {
    if (existing.contentHash) {
      return existing;
    }

    const [updated] = await db
      .update(sourcePages)
      .set({
        title: spec.sourceTitle,
        publisher:
          spec.sourceAuthority === "primary_bezemisi"
            ? "Bez emisí"
            : "Výrobce",
        sourceType: spec.sourceType,
        sourceAuthority: spec.sourceAuthority,
        retrievedAt: OBSERVED_AT,
        updatedAt: new Date(),
      })
      .where(eq(sourcePages.id, existing.id))
      .returning();

    return updated ?? existing;
  }

  const [created] = await db
    .insert(sourcePages)
    .values({
      url: spec.sourceUrl,
      canonicalUrl: spec.sourceUrl,
      title: spec.sourceTitle,
      publisher:
        spec.sourceAuthority === "primary_bezemisi" ? "Bez emisí" : "Výrobce",
      sourceType: spec.sourceType,
      sourceAuthority: spec.sourceAuthority,
      retrievedAt: OBSERVED_AT,
      httpStatus: 200,
      isCurrent: true,
    })
    .returning();

  return created!;
}

async function upsertBrand(brandSlug: string, brandName: string) {
  const db = getIngestionDb();
  const [existing] = await db
    .select()
    .from(vehicleBrands)
    .where(eq(vehicleBrands.slug, brandSlug))
    .limit(1);

  if (existing) return existing;

  const [created] = await db
    .insert(vehicleBrands)
    .values({
      name: brandName,
      slug: brandSlug,
      isActive: true,
    })
    .returning();

  return created!;
}

async function upsertModel(input: {
  brandId: string;
  modelName: string;
  modelSlug: string;
  category?: string;
  bodyType?: string;
}) {
  const db = getIngestionDb();
  const [existing] = await db
    .select()
    .from(vehicleModels)
    .where(
      and(
        eq(vehicleModels.brandId, input.brandId),
        eq(vehicleModels.slug, input.modelSlug),
      ),
    )
    .limit(1);

  if (existing) {
    const [updated] = await db
      .update(vehicleModels)
      .set({
        isPresentedByBezemisi: true,
        vehicleCategory: input.category ?? existing.vehicleCategory,
        bodyType: input.bodyType ?? existing.bodyType,
        updatedAt: new Date(),
      })
      .where(eq(vehicleModels.id, existing.id))
      .returning();
    return updated ?? existing;
  }

  const [created] = await db
    .insert(vehicleModels)
    .values({
      brandId: input.brandId,
      name: input.modelName,
      slug: input.modelSlug,
      vehicleCategory: input.category,
      bodyType: input.bodyType,
      isPresentedByBezemisi: true,
      isActive: true,
      mainImagePath: "/ev-placeholder.svg",
    })
    .returning();

  return created!;
}

async function upsertVariant(input: {
  modelId: string;
  slug: string;
  name: string;
  trimName?: string;
  batteryVariant?: string;
  drivetrain?: string;
  modelYear?: number;
  seats?: number;
  doors?: number;
}) {
  const db = getIngestionDb();
  const [existing] = await db
    .select()
    .from(vehicleVariants)
    .where(
      and(
        eq(vehicleVariants.modelId, input.modelId),
        eq(vehicleVariants.slug, input.slug),
      ),
    )
    .limit(1);

  if (existing) return existing;

  const [created] = await db
    .insert(vehicleVariants)
    .values({
      modelId: input.modelId,
      slug: input.slug,
      name: input.name,
      trimName: input.trimName,
      batteryVariant: input.batteryVariant,
      drivetrain: input.drivetrain,
      modelYear: input.modelYear,
      seats: input.seats,
      doors: input.doors,
      market: "CZ",
      isActive: true,
    })
    .returning();

  return created!;
}

async function upsertSpecification(
  variantId: string,
  spec: SeedSpec,
  runId: string,
  counters: { factsCreated: number; factsUpdated: number; warningsCount: number },
) {
  const db = getIngestionDb();
  const sourcePage = await upsertSourcePage(spec);
  const [existing] = await db
    .select()
    .from(vehicleSpecifications)
    .where(
      and(
        eq(vehicleSpecifications.variantId, variantId),
        eq(vehicleSpecifications.fieldKey, spec.fieldKey),
        eq(vehicleSpecifications.sourcePageId, sourcePage.id),
      ),
    )
    .limit(1);

  const conflict = detectSpecConflict(existing, spec);
  const verificationStatus = conflict.hasConflict ? "conflicting" : "verified";
  const valueType =
    typeof spec.value === "number"
      ? "number"
      : typeof spec.value === "boolean"
        ? "boolean"
        : "text";

  if (existing) {
    await db
      .update(vehicleSpecifications)
      .set({
        numericValue:
          valueType === "number" ? String(spec.value) : null,
        textValue: valueType === "text" ? String(spec.value) : null,
        booleanValue: valueType === "boolean" ? Boolean(spec.value) : null,
        unit: spec.unit ?? null,
        valueType,
        verificationStatus,
        observedAt: OBSERVED_AT,
        verifiedAt: OBSERVED_AT,
        notes: spec.notes ?? null,
        updatedAt: new Date(),
      })
      .where(eq(vehicleSpecifications.id, existing.id));
    counters.factsUpdated += 1;
  } else {
    await db.insert(vehicleSpecifications).values({
      variantId,
      fieldKey: spec.fieldKey,
      numericValue: valueType === "number" ? String(spec.value) : null,
      textValue: valueType === "text" ? String(spec.value) : null,
      booleanValue: valueType === "boolean" ? Boolean(spec.value) : null,
      unit: spec.unit ?? null,
      valueType,
      sourcePageId: sourcePage.id,
      verificationStatus,
      sourcePriority:
        spec.sourceAuthority === "primary_bezemisi" ? 10 : 20,
      observedAt: OBSERVED_AT,
      verifiedAt: OBSERVED_AT,
      notes: spec.notes ?? null,
    });
    counters.factsCreated += 1;
  }

  if (conflict.hasConflict) {
    counters.warningsCount += 1;
    await db.insert(catalogueIngestionIssues).values({
      ingestionRunId: runId,
      sourcePageId: sourcePage.id,
      entityType: "vehicle_specification",
      entityIdentifier: `${variantId}:${spec.fieldKey}`,
      fieldKey: spec.fieldKey,
      issueType: "conflicting_values",
      severity: "warning",
      message: `Konflikt hodnot pro ${spec.fieldKey}`,
      metadata: {
        existingValue: conflict.existingValue,
        incomingValue: conflict.incomingValue,
      },
    });
  }
}

async function upsertListPriceOffer(input: {
  variantId: string;
  title: string;
  price: number;
  sourceUrl: string;
  sourceTitle: string;
}) {
  const db = getIngestionDb();
  const sourcePage = await upsertSourcePage({
    fieldKey: "wltp_range_km",
    value: 0,
    sourceUrl: input.sourceUrl,
    sourceTitle: input.sourceTitle,
    sourceAuthority: "primary_bezemisi",
    sourceType: "bezemisi_vehicle_page",
  });

  const externalOfferId = `${input.variantId}:list-price`;

  const [existing] = await db
    .select()
    .from(vehicleOffers)
    .where(eq(vehicleOffers.externalOfferId, externalOfferId))
    .limit(1);

  if (existing) {
    await db
      .update(vehicleOffers)
      .set({
        currentPrice: String(input.price),
        listPrice: String(input.price),
        observedAt: OBSERVED_AT,
        isCurrent: true,
        updatedAt: new Date(),
      })
      .where(eq(vehicleOffers.id, existing.id));
    return "updated" as const;
  }

  await db.insert(vehicleOffers).values({
    variantId: input.variantId,
    sourcePageId: sourcePage.id,
    externalOfferId,
    title: input.title,
    offerType: "list_price",
    condition: "new",
    currentPrice: String(input.price),
    listPrice: String(input.price),
    currency: "CZK",
    vatStatus: "vcetne_dph",
    availabilityStatus: "unknown",
    observedAt: OBSERVED_AT,
    isCurrent: true,
  });

  return "created" as const;
}

export async function runCatalogueIngestion(
  options: IngestionOptions = {},
): Promise<IngestionSummary> {
  const dryRun = options.dryRun ?? false;
  const counters = {
    pagesDiscovered: DISCOVERED_CATALOGUE_MODELS.length,
    pagesProcessed: 0,
    modelsCreated: 0,
    variantsCreated: 0,
    factsCreated: 0,
    factsUpdated: 0,
    offersCreated: 0,
    offersUpdated: 0,
    warningsCount: 0,
    errorsCount: 0,
  };

  if (dryRun) {
    return {
      runId: "dry-run",
      dryRun: true,
      ...counters,
    };
  }

  const [run] = await getIngestionDb()
    .insert(catalogueIngestionRuns)
    .values({
      runType: "full_seed",
      status: "running",
      startedAt: new Date(),
      pagesDiscovered: counters.pagesDiscovered,
    })
    .returning();

  const runId = run!.id;
  const db = getIngestionDb();

  try {
    for (const discovered of DISCOVERED_CATALOGUE_MODELS) {
      const brand = await upsertBrand(discovered.brandSlug, discovered.brandName);
      const model = await upsertModel({
        brandId: brand.id,
        modelName: discovered.modelName,
        modelSlug: discovered.modelSlug,
        category: discovered.category,
        bodyType: discovered.bodyType,
      });
      counters.modelsCreated += 1;
      counters.pagesProcessed += 1;

      const seed = VERIFIED_VARIANT_SEEDS.find(
        (entry) =>
          entry.brandSlug === discovered.brandSlug &&
          entry.modelSlug === discovered.modelSlug,
      );

      if (!seed) {
        counters.warningsCount += 1;
        await db.insert(catalogueIngestionIssues).values({
          ingestionRunId: runId,
          entityType: "vehicle_model",
          entityIdentifier: `${discovered.brandSlug}/${discovered.modelSlug}`,
          issueType: "variant_ambiguity",
          severity: "warning",
          message:
            "Model je v katalogu Bez emisí, ale přesná technická varianta nebyla spolehlivě identifikována.",
        });
        continue;
      }

      for (const variantSeed of seed.variants) {
        const variant = await upsertVariant({
          modelId: model.id,
          slug: variantSeed.slug,
          name: variantSeed.name,
          trimName: variantSeed.trimName,
          batteryVariant: variantSeed.batteryVariant,
          drivetrain: variantSeed.drivetrain,
          modelYear: variantSeed.modelYear,
          seats: variantSeed.seats,
          doors: variantSeed.doors,
        });
        counters.variantsCreated += 1;

        for (const spec of variantSeed.specs) {
          await upsertSpecification(variant.id, spec, runId, counters);
        }

        if (variantSeed.listPrice) {
          const offerResult = await upsertListPriceOffer({
            variantId: variant.id,
            title:
              variantSeed.offerTitle ??
              `${discovered.modelName} – cena od`,
            price: variantSeed.listPrice,
            sourceUrl:
              discovered.detailUrl ??
              `https://www.bezemisi.cz/elektromobily/${discovered.brandSlug}/${discovered.modelSlug}`,
            sourceTitle: `${discovered.modelName} – Bez emisí`,
          });
          if (offerResult === "created") counters.offersCreated += 1;
          else counters.offersUpdated += 1;
        }
      }
    }

    for (const condition of COMMERCIAL_CONDITION_SEEDS) {
      const sourcePage = await upsertSourcePage({
        fieldKey: "wltp_range_km",
        value: 0,
        sourceUrl: condition.sourceUrl,
        sourceTitle: condition.sourceTitle,
        sourceAuthority: "primary_bezemisi",
        sourceType: "bezemisi_commercial_page",
      });

      const [existing] = await db
        .select()
        .from(commercialConditions)
        .where(
          and(
            eq(commercialConditions.conditionType, condition.conditionType),
            eq(commercialConditions.sourcePageId, sourcePage.id),
          ),
        )
        .limit(1);

      if (!existing) {
        await db.insert(commercialConditions).values({
          conditionType: condition.conditionType,
          title: condition.title,
          content: condition.content,
          sourcePageId: sourcePage.id,
          verificationStatus: "verified",
          observedAt: OBSERVED_AT,
          verifiedAt: OBSERVED_AT,
          isCurrent: true,
        });
      }
    }

    await db
      .update(catalogueIngestionRuns)
      .set({
        status:
          counters.warningsCount > 0
            ? "completed_with_warnings"
            : "completed",
        completedAt: new Date(),
        pagesProcessed: counters.pagesProcessed,
        modelsCreated: counters.modelsCreated,
        variantsCreated: counters.variantsCreated,
        factsCreated: counters.factsCreated,
        factsUpdated: counters.factsUpdated,
        offersCreated: counters.offersCreated,
        offersUpdated: counters.offersUpdated,
        warningsCount: counters.warningsCount,
        errorsCount: counters.errorsCount,
        updatedAt: new Date(),
      })
      .where(eq(catalogueIngestionRuns.id, runId));
  } catch (error) {
    counters.errorsCount += 1;
    await db
      .update(catalogueIngestionRuns)
      .set({
        status: "failed",
        completedAt: new Date(),
        errorsCount: counters.errorsCount,
        updatedAt: new Date(),
        metadata: {
          error: error instanceof Error ? error.message : "unknown",
        },
      })
      .where(eq(catalogueIngestionRuns.id, runId));
    throw error;
  }

  return {
    runId,
    dryRun: false,
    ...counters,
  };
}
