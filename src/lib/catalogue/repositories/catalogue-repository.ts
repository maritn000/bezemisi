import "server-only";

import { createDb } from "@/db/create-client";
import { getNormalizedDatabaseUrl } from "@/env";

let cachedDb: ReturnType<typeof createDb> | null = null;

function getDb() {
  if (!cachedDb) {
    cachedDb = createDb(getNormalizedDatabaseUrl());
  }
  return cachedDb;
}
import { and, asc, desc, eq, gte, ilike, inArray, lte, sql } from "drizzle-orm";

import {
  commercialConditions,
  sourcePages,
  vehicleBrands,
  vehicleModels,
  vehicleOffers,
  vehicleSpecifications,
  vehicleVariants,
} from "@/db/schema";

import { OFFER_STALE_DAYS, WLTP_RANGE_FIELD_KEY } from "../constants";
import {
  canonicalizeRangeFieldKey,
  isUsableVerifiedRangeValue,
  parseRangeNumericValue,
} from "../range-field-keys";
import type {
  CatalogueOffer,
  CatalogueVariantSummary,
  CommercialConditionResult,
  SourceReference,
  VerifiedSpecification,
} from "../types";

const CONFIDENT_STATUSES = ["verified"] as const;

function toIso(value: Date | string | null | undefined) {
  if (!value) return "";
  return value instanceof Date ? value.toISOString().slice(0, 10) : String(value);
}

function mapSourceReference(
  page: typeof sourcePages.$inferSelect,
  extras?: { variantId?: string; modelId?: string },
): SourceReference {
  return {
    id: page.id,
    title: page.title,
    url: page.url,
    publisher: page.publisher,
    sourceType: page.sourceType,
    checkedAt: toIso(page.retrievedAt ?? page.updatedAt),
    variantId: extras?.variantId,
    modelId: extras?.modelId,
  };
}

function mapSpecification(
  spec: typeof vehicleSpecifications.$inferSelect,
  source: SourceReference,
): VerifiedSpecification {
  const canonicalFieldKey =
    canonicalizeRangeFieldKey(spec.fieldKey) ?? spec.fieldKey;
  const value =
    spec.valueType === "number"
      ? Number(spec.numericValue)
      : spec.valueType === "boolean"
        ? Boolean(spec.booleanValue)
        : String(spec.textValue ?? "");

  return {
    fieldKey: canonicalFieldKey,
    value,
    unit: spec.unit,
    verificationStatus: spec.verificationStatus,
    source,
  };
}

function selectPreferredSpecifications(
  rows: Array<{
    spec: typeof vehicleSpecifications.$inferSelect;
    page: typeof sourcePages.$inferSelect;
  }>,
  variantId: string,
): VerifiedSpecification[] {
  const grouped = new Map<string, typeof rows>();

  for (const row of rows) {
    const canonicalKey =
      canonicalizeRangeFieldKey(row.spec.fieldKey) ?? row.spec.fieldKey;
    const key = `${canonicalKey}`;
    const bucket = grouped.get(key) ?? [];
    bucket.push(row);
    grouped.set(key, bucket);
  }

  const selected: VerifiedSpecification[] = [];

  for (const [fieldKey, bucket] of grouped) {
    const verified = bucket.filter((row) =>
      CONFIDENT_STATUSES.includes(
        row.spec.verificationStatus as (typeof CONFIDENT_STATUSES)[number],
      ),
    );

    const candidates = verified.length > 0 ? verified : bucket;
    const preferred = [...candidates].sort((left, right) => {
      const leftPriority = left.spec.sourcePriority ?? 100;
      const rightPriority = right.spec.sourcePriority ?? 100;
      if (leftPriority !== rightPriority) {
        return leftPriority - rightPriority;
      }

      const leftObserved = new Date(left.spec.observedAt ?? 0).getTime();
      const rightObserved = new Date(right.spec.observedAt ?? 0).getTime();
      if (leftObserved !== rightObserved) {
        return rightObserved - leftObserved;
      }

      const leftNumeric = parseRangeNumericValue(left.spec) ?? 0;
      const rightNumeric = parseRangeNumericValue(right.spec) ?? 0;
      return rightNumeric - leftNumeric;
    })[0];

    if (!preferred) continue;

    const mapped = mapSpecification(
      {
        ...preferred.spec,
        fieldKey,
      },
      mapSourceReference(preferred.page, { variantId }),
    );

    if (
      canonicalizeRangeFieldKey(fieldKey) &&
      !isUsableVerifiedRangeValue(fieldKey, mapped.value)
    ) {
      continue;
    }

    selected.push(mapped);
  }

  return selected;
}

function mapOffer(
  offer: typeof vehicleOffers.$inferSelect,
  source: SourceReference,
): CatalogueOffer {
  return {
    id: offer.id,
    title: offer.title,
    currentPrice: offer.currentPrice ? Number(offer.currentPrice) : null,
    currency: offer.currency,
    availabilityStatus: offer.availabilityStatus,
    observedAt: toIso(offer.observedAt),
    offerUrl: offer.offerUrl,
    source,
    isCurrent: offer.isCurrent,
  };
}

export async function listPresentedModels() {
  return getDb()
    .select({
      model: vehicleModels,
      brand: vehicleBrands,
    })
    .from(vehicleModels)
    .innerJoin(vehicleBrands, eq(vehicleModels.brandId, vehicleBrands.id))
    .where(
      and(
        eq(vehicleModels.isPresentedByBezemisi, true),
        eq(vehicleModels.isActive, true),
      ),
    )
    .orderBy(asc(vehicleBrands.name), asc(vehicleModels.name));
}

export async function findModelBySlugs(brandSlug: string, modelSlug: string) {
  const [row] = await getDb()
    .select({
      model: vehicleModels,
      brand: vehicleBrands,
    })
    .from(vehicleModels)
    .innerJoin(vehicleBrands, eq(vehicleModels.brandId, vehicleBrands.id))
    .where(
      and(
        eq(vehicleBrands.slug, brandSlug),
        eq(vehicleModels.slug, modelSlug),
        eq(vehicleModels.isActive, true),
      ),
    )
    .limit(1);

  return row ?? null;
}

export async function getVariantSummariesByIds(variantIds: string[]) {
  if (variantIds.length === 0) return [];

  const variants = await getDb()
    .select({
      variant: vehicleVariants,
      model: vehicleModels,
      brand: vehicleBrands,
    })
    .from(vehicleVariants)
    .innerJoin(vehicleModels, eq(vehicleVariants.modelId, vehicleModels.id))
    .innerJoin(vehicleBrands, eq(vehicleModels.brandId, vehicleBrands.id))
    .where(
      and(
        inArray(vehicleVariants.id, variantIds),
        eq(vehicleVariants.isActive, true),
      ),
    );

  return buildVariantSummaries(variants);
}

async function buildVariantSummaries(
  rows: Array<{
    variant: typeof vehicleVariants.$inferSelect;
    model: typeof vehicleModels.$inferSelect;
    brand: typeof vehicleBrands.$inferSelect;
  }>,
): Promise<CatalogueVariantSummary[]> {
  const variantIds = rows.map((row) => row.variant.id);
  if (variantIds.length === 0) return [];

  const specs = await getDb()
    .select({
      spec: vehicleSpecifications,
      page: sourcePages,
    })
    .from(vehicleSpecifications)
    .innerJoin(sourcePages, eq(vehicleSpecifications.sourcePageId, sourcePages.id))
    .where(inArray(vehicleSpecifications.variantId, variantIds));

  const offers = await getDb()
    .select({
      offer: vehicleOffers,
      page: sourcePages,
    })
    .from(vehicleOffers)
    .innerJoin(sourcePages, eq(vehicleOffers.sourcePageId, sourcePages.id))
    .where(
      and(
        inArray(vehicleOffers.variantId, variantIds),
        eq(vehicleOffers.isCurrent, true),
      ),
    );

  const staleCutoff = new Date();
  staleCutoff.setDate(staleCutoff.getDate() - OFFER_STALE_DAYS);

  return rows.map(({ variant, model, brand }) => {
    const variantSpecs = specs.filter((row) => row.spec.variantId === variant.id);
    const conflictingFields = [
      ...new Set(
        variantSpecs
          .filter((row) => row.spec.verificationStatus === "conflicting")
          .map((row) => canonicalizeRangeFieldKey(row.spec.fieldKey) ?? row.spec.fieldKey),
      ),
    ];
    const specifications = selectPreferredSpecifications(variantSpecs, variant.id);
    const presentFields = new Set(specifications.map((spec) => spec.fieldKey));
    const missingFields = [
      "wltp_range_km",
      "battery_capacity_usable_kwh",
      "max_dc_charging_kw",
      "boot_capacity_l",
    ].filter((field) => !presentFields.has(field));

    const variantOffers = offers
      .filter((row) => row.offer.variantId === variant.id)
      .filter((row) => new Date(row.offer.observedAt) >= staleCutoff)
      .map((row) =>
        mapOffer(row.offer, mapSourceReference(row.page, { variantId: variant.id })),
      );

    return {
      id: variant.id,
      name: variant.name,
      slug: variant.slug,
      brandName: brand.name,
      modelName: model.name,
      modelSlug: model.slug,
      brandSlug: brand.slug,
      trimName: variant.trimName,
      batteryVariant: variant.batteryVariant,
      drivetrain: variant.drivetrain,
      specifications,
      currentOffers: variantOffers,
      missingFields,
      conflictingFields,
    };
  });
}

export async function searchVariants(filters: {
  brand?: string;
  model?: string;
  minimumWltpRange?: number;
  minimumRealRange?: number;
  minimumBootCapacity?: number;
  minimumSeats?: number;
  maximumPrice?: number;
  drivetrain?: string;
  bodyType?: string;
  availability?: string;
  requiredFeature?: string;
  limit?: number;
}) {
  const rows = await getDb()
    .select({
      variant: vehicleVariants,
      model: vehicleModels,
      brand: vehicleBrands,
    })
    .from(vehicleVariants)
    .innerJoin(vehicleModels, eq(vehicleVariants.modelId, vehicleModels.id))
    .innerJoin(vehicleBrands, eq(vehicleModels.brandId, vehicleBrands.id))
    .where(
      and(
        eq(vehicleVariants.isActive, true),
        eq(vehicleModels.isActive, true),
        eq(vehicleModels.isPresentedByBezemisi, true),
        filters.brand
          ? ilike(vehicleBrands.slug, `%${filters.brand}%`)
          : undefined,
        filters.model
          ? ilike(vehicleModels.slug, `%${filters.model}%`)
          : undefined,
        filters.drivetrain
          ? ilike(vehicleVariants.drivetrain, `%${filters.drivetrain}%`)
          : undefined,
        filters.bodyType
          ? ilike(vehicleModels.bodyType, `%${filters.bodyType}%`)
          : undefined,
        filters.minimumSeats
          ? gte(vehicleVariants.seats, filters.minimumSeats)
          : undefined,
      ),
    );

  const summaries = await buildVariantSummaries(rows);
  const filtered = summaries.filter((variant) => {
    const specMap = new Map(
      variant.specifications.map((spec) => [spec.fieldKey, spec.value]),
    );

    if (filters.minimumWltpRange !== undefined) {
      const value = specMap.get(WLTP_RANGE_FIELD_KEY);
      if (typeof value !== "number" || value < filters.minimumWltpRange) {
        return false;
      }
    }

    if (filters.minimumRealRange) {
      const value = specMap.get("estimated_real_range_km");
      if (typeof value !== "number" || value < filters.minimumRealRange) {
        return false;
      }
    }

    if (filters.minimumBootCapacity) {
      const value = specMap.get("boot_capacity_l");
      if (typeof value !== "number" || value < filters.minimumBootCapacity) {
        return false;
      }
    }

    if (filters.requiredFeature && !specMap.has(filters.requiredFeature)) {
      return false;
    }

    if (filters.maximumPrice) {
      const prices = variant.currentOffers
        .map((offer) => offer.currentPrice)
        .filter((price): price is number => price !== null);
      if (prices.length === 0 || Math.min(...prices) > filters.maximumPrice) {
        return false;
      }
    }

    if (filters.availability) {
      const hasAvailability = variant.currentOffers.some(
        (offer) => offer.availabilityStatus === filters.availability,
      );
      if (!hasAvailability) return false;
    }

    return true;
  });

  const limit = filters.limit ?? 10;
  return {
    variants: filtered.slice(0, limit),
    totalMatched: filtered.length,
  };
}

export async function findVariantsByIdentifier(identifier: string) {
  const normalized = identifier.trim().toLowerCase();

  const rows = await getDb()
    .select({
      variant: vehicleVariants,
      model: vehicleModels,
      brand: vehicleBrands,
    })
    .from(vehicleVariants)
    .innerJoin(vehicleModels, eq(vehicleVariants.modelId, vehicleModels.id))
    .innerJoin(vehicleBrands, eq(vehicleModels.brandId, vehicleBrands.id))
    .where(
      and(
        eq(vehicleVariants.isActive, true),
        sql`(
          lower(${vehicleBrands.slug}) = ${normalized} OR
          lower(${vehicleModels.slug}) = ${normalized} OR
          lower(${vehicleVariants.slug}) = ${normalized} OR
          lower(${vehicleBrands.name}) = ${normalized} OR
          lower(${vehicleModels.name}) = ${normalized} OR
          lower(concat(${vehicleBrands.name}, ' ', ${vehicleModels.name})) = ${normalized} OR
          lower(concat(${vehicleBrands.slug}, '-', ${vehicleModels.slug})) = ${normalized} OR
          lower(concat(${vehicleBrands.slug}, '/', ${vehicleModels.slug})) = ${normalized}
        )`,
      ),
    )
    .orderBy(asc(vehicleVariants.slug));

  return buildVariantSummaries(rows);
}

export async function getCurrentOffers(filters: {
  brand?: string;
  model?: string;
  variantId?: string;
  priceLimit?: number;
  availabilityStatus?: string;
  limit?: number;
}) {
  const staleCutoff = new Date();
  staleCutoff.setDate(staleCutoff.getDate() - OFFER_STALE_DAYS);

  const rows = await getDb()
    .select({
      offer: vehicleOffers,
      page: sourcePages,
      variant: vehicleVariants,
      model: vehicleModels,
      brand: vehicleBrands,
    })
    .from(vehicleOffers)
    .innerJoin(sourcePages, eq(vehicleOffers.sourcePageId, sourcePages.id))
    .innerJoin(vehicleVariants, eq(vehicleOffers.variantId, vehicleVariants.id))
    .innerJoin(vehicleModels, eq(vehicleVariants.modelId, vehicleModels.id))
    .innerJoin(vehicleBrands, eq(vehicleModels.brandId, vehicleBrands.id))
    .where(
      and(
        eq(vehicleOffers.isCurrent, true),
        gte(vehicleOffers.observedAt, staleCutoff),
        filters.variantId
          ? eq(vehicleOffers.variantId, filters.variantId)
          : undefined,
        filters.brand
          ? ilike(vehicleBrands.slug, `%${filters.brand}%`)
          : undefined,
        filters.model
          ? ilike(vehicleModels.slug, `%${filters.model}%`)
          : undefined,
        filters.availabilityStatus
          ? eq(
              vehicleOffers.availabilityStatus,
              filters.availabilityStatus as
                | "available"
                | "reserved"
                | "sold"
                | "on_order"
                | "unknown",
            )
          : undefined,
        filters.priceLimit
          ? lte(vehicleOffers.currentPrice, String(filters.priceLimit))
          : undefined,
      ),
    )
    .orderBy(desc(vehicleOffers.observedAt))
    .limit(filters.limit ?? 10);

  return rows.map((row) => ({
    ...mapOffer(
      row.offer,
      mapSourceReference(row.page, { variantId: row.variant.id }),
    ),
    brandName: row.brand.name,
    modelName: row.model.name,
    variantName: row.variant.name,
  }));
}

export async function getCommercialConditions(
  conditionTypes: Array<
    | "purchase_process"
    | "financing"
    | "operating_lease"
    | "trade_in"
    | "warranty"
    | "delivery"
    | "reservation"
    | "deposit"
    | "payment"
    | "returns"
    | "contact"
    | "other"
  >,
) {
  const rows = await getDb()
    .select({
      condition: commercialConditions,
      page: sourcePages,
    })
    .from(commercialConditions)
    .innerJoin(sourcePages, eq(commercialConditions.sourcePageId, sourcePages.id))
    .where(
      and(
        eq(commercialConditions.isCurrent, true),
        inArray(commercialConditions.conditionType, conditionTypes),
        eq(commercialConditions.verificationStatus, "verified"),
      ),
    )
    .orderBy(asc(commercialConditions.conditionType));

  return rows.map(
    (row): CommercialConditionResult => ({
      id: row.condition.id,
      conditionType: row.condition.conditionType,
      title: row.condition.title,
      content: row.condition.content,
      observedAt: toIso(row.condition.observedAt),
      source: mapSourceReference(row.page),
    }),
  );
}

export async function countCatalogueStats() {
  const [brands] = await getDb()
    .select({ count: sql<number>`count(*)::int` })
    .from(vehicleBrands);
  const [models] = await getDb()
    .select({ count: sql<number>`count(*)::int` })
    .from(vehicleModels);
  const [variants] = await getDb()
    .select({ count: sql<number>`count(*)::int` })
    .from(vehicleVariants);
  const [verifiedFacts] = await getDb()
    .select({ count: sql<number>`count(*)::int` })
    .from(vehicleSpecifications)
    .where(eq(vehicleSpecifications.verificationStatus, "verified"));
  const [conflictingFacts] = await getDb()
    .select({ count: sql<number>`count(*)::int` })
    .from(vehicleSpecifications)
    .where(eq(vehicleSpecifications.verificationStatus, "conflicting"));
  const [currentOffers] = await getDb()
    .select({ count: sql<number>`count(*)::int` })
    .from(vehicleOffers)
    .where(eq(vehicleOffers.isCurrent, true));
  const [conditions] = await getDb()
    .select({ count: sql<number>`count(*)::int` })
    .from(commercialConditions)
    .where(eq(commercialConditions.isCurrent, true));
  const [sourcePageCount] = await getDb()
    .select({ count: sql<number>`count(*)::int` })
    .from(sourcePages);

  return {
    brands: brands?.count ?? 0,
    models: models?.count ?? 0,
    variants: variants?.count ?? 0,
    verifiedFacts: verifiedFacts?.count ?? 0,
    conflictingFacts: conflictingFacts?.count ?? 0,
    currentOffers: currentOffers?.count ?? 0,
    commercialConditions: conditions?.count ?? 0,
    sourcePages: sourcePageCount?.count ?? 0,
  };
}
