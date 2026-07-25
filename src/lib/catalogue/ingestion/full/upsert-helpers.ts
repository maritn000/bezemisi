import { and, eq, like, or, sql } from "drizzle-orm";

import { createDb } from "@/db/create-client";
import {
  catalogueIngestionIssues,
  commercialConditions,
  sourcePages,
  vehicleBrands,
  vehicleModelSpecifications,
  vehicleModels,
  vehicleOffers,
  vehicleSpecifications,
  vehicleVariants,
} from "@/db/schema";

import type { ModelLevelFieldKey, SpecFieldKey } from "../../constants";
import type { SeedSpec } from "../seed-data";

export type FactInput = {
  fieldKey: string;
  value: number | string | boolean;
  unit?: string;
  sourceUrl: string;
  sourceTitle: string;
  sourceAuthority: "primary_bezemisi" | "primary_manufacturer";
  sourceType:
    | "bezemisi_vehicle_page"
    | "bezemisi_offer_page"
    | "bezemisi_commercial_page"
    | "manufacturer_model_page";
  notes?: string;
  contentHash?: string;
  httpStatus?: number;
};

type Db = ReturnType<typeof createDb>;

export async function upsertSourcePageRecord(
  db: Db,
  input: {
    url: string;
    title: string;
    sourceType: FactInput["sourceType"];
    sourceAuthority: FactInput["sourceAuthority"];
    contentHash?: string;
    httpStatus?: number;
    observedAt: Date;
  },
) {
  const [existing] = await db
    .select()
    .from(sourcePages)
    .where(eq(sourcePages.url, input.url))
    .limit(1);

  if (existing) {
    const shouldUpdateHash =
      input.contentHash &&
      existing.contentHash &&
      existing.contentHash !== input.contentHash;

    if (!shouldUpdateHash && existing.contentHash) {
      return existing;
    }

    const [updated] = await db
      .update(sourcePages)
      .set({
        title: input.title,
        publisher:
          input.sourceAuthority === "primary_bezemisi" ? "Bez emisí" : "Výrobce",
        sourceType: input.sourceType,
        sourceAuthority: input.sourceAuthority,
        contentHash: input.contentHash ?? existing.contentHash,
        httpStatus: input.httpStatus ?? existing.httpStatus,
        retrievedAt: input.observedAt,
        updatedAt: new Date(),
      })
      .where(eq(sourcePages.id, existing.id))
      .returning();
    return updated ?? existing;
  }

  const [created] = await db
    .insert(sourcePages)
    .values({
      url: input.url,
      canonicalUrl: input.url,
      title: input.title,
      publisher:
        input.sourceAuthority === "primary_bezemisi" ? "Bez emisí" : "Výrobce",
      sourceType: input.sourceType,
      sourceAuthority: input.sourceAuthority,
      contentHash: input.contentHash ?? null,
      httpStatus: input.httpStatus ?? 200,
      retrievedAt: input.observedAt,
      isCurrent: true,
    })
    .returning();

  return created!;
}

function toValueType(value: number | string | boolean) {
  if (typeof value === "number") return "number" as const;
  if (typeof value === "boolean") return "boolean" as const;
  return "text" as const;
}

export async function upsertModelSpecification(
  db: Db,
  modelId: string,
  fact: FactInput,
  observedAt: Date,
  options?: { skipIfVerifiedExists?: boolean },
) {
  const sourcePage = await upsertSourcePageRecord(db, {
    url: fact.sourceUrl,
    title: fact.sourceTitle,
    sourceType: fact.sourceType,
    sourceAuthority: fact.sourceAuthority,
    contentHash: fact.contentHash,
    httpStatus: fact.httpStatus,
    observedAt,
  });

  const [existing] = await db
    .select()
    .from(vehicleModelSpecifications)
    .where(
      and(
        eq(vehicleModelSpecifications.modelId, modelId),
        eq(vehicleModelSpecifications.fieldKey, fact.fieldKey),
        eq(vehicleModelSpecifications.sourcePageId, sourcePage.id),
      ),
    )
    .limit(1);

  if (
    options?.skipIfVerifiedExists &&
    existing?.verificationStatus === "verified"
  ) {
    return { action: "skipped" as const, sourcePageId: sourcePage.id };
  }

  const valueType = toValueType(fact.value);
  const values = {
    numericValue: valueType === "number" ? String(fact.value) : null,
    textValue: valueType === "text" ? String(fact.value) : null,
    booleanValue: valueType === "boolean" ? Boolean(fact.value) : null,
    unit: fact.unit ?? null,
    valueType,
    verificationStatus: "verified" as const,
    sourcePriority: fact.sourceAuthority === "primary_bezemisi" ? 10 : 20,
    observedAt,
    verifiedAt: observedAt,
    notes: fact.notes ?? null,
    updatedAt: new Date(),
  };

  if (existing) {
    await db
      .update(vehicleModelSpecifications)
      .set(values)
      .where(eq(vehicleModelSpecifications.id, existing.id));
    return { action: "updated" as const, sourcePageId: sourcePage.id };
  }

  await db.insert(vehicleModelSpecifications).values({
    modelId,
    fieldKey: fact.fieldKey,
    ...values,
    sourcePageId: sourcePage.id,
  });
  return { action: "created" as const, sourcePageId: sourcePage.id };
}

export async function upsertVariantSpecification(
  db: Db,
  variantId: string,
  fact: FactInput,
  observedAt: Date,
  options?: { skipIfVerifiedExists?: boolean },
) {
  const sourcePage = await upsertSourcePageRecord(db, {
    url: fact.sourceUrl,
    title: fact.sourceTitle,
    sourceType: fact.sourceType,
    sourceAuthority: fact.sourceAuthority,
    contentHash: fact.contentHash,
    httpStatus: fact.httpStatus,
    observedAt,
  });

  const [existing] = await db
    .select()
    .from(vehicleSpecifications)
    .where(
      and(
        eq(vehicleSpecifications.variantId, variantId),
        eq(vehicleSpecifications.fieldKey, fact.fieldKey),
        eq(vehicleSpecifications.sourcePageId, sourcePage.id),
      ),
    )
    .limit(1);

  if (
    options?.skipIfVerifiedExists &&
    existing?.verificationStatus === "verified"
  ) {
    return { action: "skipped" as const, sourcePageId: sourcePage.id };
  }

  const valueType = toValueType(fact.value);
  const values = {
    numericValue: valueType === "number" ? String(fact.value) : null,
    textValue: valueType === "text" ? String(fact.value) : null,
    booleanValue: valueType === "boolean" ? Boolean(fact.value) : null,
    unit: fact.unit ?? null,
    valueType,
    verificationStatus: "verified" as const,
    sourcePriority: fact.sourceAuthority === "primary_bezemisi" ? 10 : 20,
    observedAt,
    verifiedAt: observedAt,
    notes: fact.notes ?? null,
    updatedAt: new Date(),
  };

  if (existing) {
    await db
      .update(vehicleSpecifications)
      .set(values)
      .where(eq(vehicleSpecifications.id, existing.id));
    return { action: "updated" as const, sourcePageId: sourcePage.id };
  }

  await db.insert(vehicleSpecifications).values({
    variantId,
    fieldKey: fact.fieldKey,
    ...values,
    sourcePageId: sourcePage.id,
  });
  return { action: "created" as const, sourcePageId: sourcePage.id };
}

export async function upsertBrandRecord(
  db: Db,
  brandSlug: string,
  brandName: string,
) {
  const [existing] = await db
    .select()
    .from(vehicleBrands)
    .where(eq(vehicleBrands.slug, brandSlug))
    .limit(1);
  if (existing) return existing;

  const [created] = await db
    .insert(vehicleBrands)
    .values({ name: brandName, slug: brandSlug, isActive: true })
    .returning();
  return created!;
}

export async function upsertModelRecord(
  db: Db,
  input: {
    brandId: string;
    modelName: string;
    modelSlug: string;
    category?: string | null;
    bodyType?: string | null;
    description?: string | null;
    mainImagePath?: string | null;
  },
) {
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
        description: input.description ?? existing.description,
        mainImagePath:
          input.mainImagePath &&
          (!existing.mainImagePath ||
            existing.mainImagePath === "/ev-placeholder.svg")
            ? input.mainImagePath
            : existing.mainImagePath,
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
      vehicleCategory: input.category ?? undefined,
      bodyType: input.bodyType ?? undefined,
      description: input.description ?? undefined,
      mainImagePath: input.mainImagePath ?? "/ev-placeholder.svg",
      isPresentedByBezemisi: true,
      isActive: true,
    })
    .returning();
  return created!;
}

export async function deactivateInvalidPresentedModels(db: Db) {
  const rows = await db
    .select({
      modelId: vehicleModels.id,
      modelName: vehicleModels.name,
      brandSlug: vehicleBrands.slug,
    })
    .from(vehicleModels)
    .innerJoin(vehicleBrands, eq(vehicleModels.brandId, vehicleBrands.id))
    .where(
      and(
        eq(vehicleModels.isPresentedByBezemisi, true),
        or(
          like(vehicleModels.name, "%${%"),
          like(vehicleBrands.slug, "data-%"),
          sql`length(${vehicleModels.name}) > 120`,
        ),
      ),
    );

  for (const row of rows) {
    await db
      .update(vehicleModels)
      .set({ isPresentedByBezemisi: false, updatedAt: new Date() })
      .where(eq(vehicleModels.id, row.modelId));
  }

  return rows.length;
}

export async function upsertVariantRecord(
  db: Db,
  input: {
    modelId: string;
    slug: string;
    name: string;
    trimName?: string;
    batteryVariant?: string;
    drivetrain?: string;
    modelYear?: number;
  },
) {
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
      market: "CZ",
      isActive: true,
    })
    .returning();
  return created!;
}

export async function upsertOfferRecord(
  db: Db,
  input: {
    variantId?: string;
    modelId?: string;
    externalOfferId: string;
    title: string;
    offerUrl?: string;
    offerType: string;
    listPrice?: number | null;
    currentPrice?: number | null;
    vatStatus?: string;
    availabilityStatus?: "available" | "reserved" | "sold" | "on_order" | "unknown";
    availabilityText?: string;
    condition?: "new" | "used" | "demonstration" | "unknown";
    mileageKm?: number | null;
    colour?: string | null;
    vin?: string | null;
    modelYear?: number | null;
    registrationYear?: number | null;
    location?: string | null;
    financingAvailable?: boolean;
    operatingLeaseAvailable?: boolean;
    sourceUrl: string;
    sourceTitle: string;
    observedAt: Date;
  },
) {
  const sourcePage = await upsertSourcePageRecord(db, {
    url: input.sourceUrl,
    title: input.sourceTitle,
    sourceType: "bezemisi_offer_page",
    sourceAuthority: "primary_bezemisi",
    observedAt: input.observedAt,
  });

  const [existing] = await db
    .select()
    .from(vehicleOffers)
    .where(eq(vehicleOffers.externalOfferId, input.externalOfferId))
    .limit(1);

  const values = {
    variantId: input.variantId ?? null,
    modelId: input.modelId ?? null,
    sourcePageId: sourcePage.id,
    title: input.title,
    offerUrl: input.offerUrl ?? null,
    offerType: input.offerType,
    condition: input.condition ?? "new",
    modelYear: input.modelYear ?? null,
    registrationYear: input.registrationYear ?? null,
    mileageKm: input.mileageKm ?? null,
    colour: input.colour ?? null,
    vin: input.vin ?? null,
    listPrice:
      input.listPrice != null ? String(input.listPrice) : null,
    currentPrice:
      input.currentPrice != null ? String(input.currentPrice) : null,
    currency: "CZK",
    vatStatus: input.vatStatus ?? "vcetne_dph",
    financingAvailable: input.financingAvailable ?? null,
    operatingLeaseAvailable: input.operatingLeaseAvailable ?? null,
    availabilityStatus: input.availabilityStatus ?? "unknown",
    availabilityText: input.availabilityText ?? null,
    location: input.location ?? null,
    observedAt: input.observedAt,
    isCurrent: true,
    updatedAt: new Date(),
  };

  if (existing) {
    await db
      .update(vehicleOffers)
      .set(values)
      .where(eq(vehicleOffers.id, existing.id));
    return { action: "updated" as const };
  }

  await db.insert(vehicleOffers).values({
    externalOfferId: input.externalOfferId,
    ...values,
  });
  return { action: "created" as const };
}

export async function upsertCommercialConditionRecord(
  db: Db,
  input: {
    conditionType:
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
      | "other";
    title: string;
    content: string;
    structuredValue?: Record<string, unknown>;
    sourceUrl: string;
    sourceTitle: string;
    observedAt: Date;
  },
) {
  const sourcePage = await upsertSourcePageRecord(db, {
    url: input.sourceUrl,
    title: input.sourceTitle,
    sourceType: "bezemisi_commercial_page",
    sourceAuthority: "primary_bezemisi",
    observedAt: input.observedAt,
  });

  const [existing] = await db
    .select()
    .from(commercialConditions)
    .where(
      and(
        eq(commercialConditions.conditionType, input.conditionType),
        eq(commercialConditions.sourcePageId, sourcePage.id),
        eq(commercialConditions.title, input.title),
      ),
    )
    .limit(1);

  if (existing) {
    return existing;
  }

  const [created] = await db
    .insert(commercialConditions)
    .values({
      conditionType: input.conditionType,
      title: input.title,
      content: input.content,
      structuredValue: input.structuredValue ?? {},
      sourcePageId: sourcePage.id,
      verificationStatus: "verified",
      observedAt: input.observedAt,
      verifiedAt: input.observedAt,
      isCurrent: true,
    })
    .returning();
  return created!;
}

export async function recordIngestionIssue(
  db: Db,
  runId: string,
  issue: {
    entityType: string;
    entityIdentifier?: string;
    fieldKey?: string;
    issueType: string;
    severity?: "warning" | "error";
    message: string;
    metadata?: Record<string, unknown>;
    sourcePageId?: string;
  },
) {
  await db.insert(catalogueIngestionIssues).values({
    ingestionRunId: runId,
    sourcePageId: issue.sourcePageId ?? null,
    entityType: issue.entityType,
    entityIdentifier: issue.entityIdentifier ?? null,
    fieldKey: issue.fieldKey ?? null,
    issueType: issue.issueType,
    severity: issue.severity ?? "warning",
    message: issue.message,
    metadata: issue.metadata ?? {},
  });
}

export function seedSpecToFact(spec: SeedSpec): FactInput {
  return {
    fieldKey: spec.fieldKey,
    value: spec.value,
    unit: spec.unit,
    sourceUrl: spec.sourceUrl,
    sourceTitle: spec.sourceTitle,
    sourceAuthority: spec.sourceAuthority,
    sourceType: spec.sourceType,
    notes: spec.notes,
  };
}

export type ModelFactKey = ModelLevelFieldKey | SpecFieldKey;
