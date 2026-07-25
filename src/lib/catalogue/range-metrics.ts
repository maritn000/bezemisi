import "server-only";

import { and, eq, inArray, or, sql } from "drizzle-orm";

import { createDb } from "@/db/create-client";
import {
  sourcePages,
  vehicleBrands,
  vehicleModels,
  vehicleSpecifications,
  vehicleVariants,
} from "@/db/schema";
import { getNormalizedDatabaseUrl } from "@/env";

import {
  RANGE_FIELD_KEYS,
  WLTP_RANGE_FIELD_KEY,
  REAL_RANGE_FIELD_KEY,
} from "./constants";
import {
  canonicalizeRangeFieldKey,
  isLegacyRangeFieldKey,
  parseRangeNumericValue,
} from "./range-field-keys";

export type RangeFactRow = {
  brand: string;
  model: string;
  variant: string;
  modelYear: number | null;
  drivetrain: string | null;
  batteryVariant: string | null;
  fieldKey: string;
  canonicalFieldKey: string | null;
  numericValue: number | null;
  unit: string | null;
  verificationStatus: string;
  sourceTitle: string;
  sourceUrl: string;
  observedAt: Date | string | null;
  verifiedAt: Date | string | null;
};

export type RangeMetrics = {
  verifiedWltpFacts: number;
  verifiedRealRangeFacts: number;
  variantsMissingWltp: Array<{
    brand: string;
    model: string;
    variant: string;
    batteryVariant: string | null;
  }>;
  ambiguousRangeFacts: Array<{
    brand: string;
    model: string;
    variant: string;
    fieldKey: string;
    reason: string;
  }>;
  conflictingRangeFacts: Array<{
    brand: string;
    model: string;
    variant: string;
    fieldKey: string;
    values: number[];
  }>;
  facts: RangeFactRow[];
};

function getDb() {
  return createDb(getNormalizedDatabaseUrl());
}

export async function collectRangeMetrics(): Promise<RangeMetrics> {
  const db = getDb();

  const rangeRows = await db
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
    .where(
      and(
        eq(vehicleVariants.isActive, true),
        eq(vehicleModels.isActive, true),
        or(
          inArray(vehicleSpecifications.fieldKey, [...RANGE_FIELD_KEYS]),
          sql`lower(${vehicleSpecifications.fieldKey}) like '%range%'`,
          sql`lower(${vehicleSpecifications.fieldKey}) like '%dojezd%'`,
          sql`lower(${vehicleSpecifications.fieldKey}) like '%wltp%'`,
        ),
      ),
    )
    .orderBy(vehicleBrands.name, vehicleModels.name, vehicleVariants.name);

  const facts: RangeFactRow[] = rangeRows.map((row) => ({
    brand: row.brand.name,
    model: row.model.name,
    variant: row.variant.name,
    modelYear: row.variant.modelYear,
    drivetrain: row.variant.drivetrain,
    batteryVariant: row.variant.batteryVariant,
    fieldKey: row.spec.fieldKey,
    canonicalFieldKey: canonicalizeRangeFieldKey(row.spec.fieldKey),
    numericValue: parseRangeNumericValue(row.spec),
    unit: row.spec.unit,
    verificationStatus: row.spec.verificationStatus,
    sourceTitle: row.page.title,
    sourceUrl: row.page.url,
    observedAt: row.spec.observedAt,
    verifiedAt: row.spec.verifiedAt,
  }));

  const verifiedWltpFacts = facts.filter(
    (fact) =>
      fact.canonicalFieldKey === WLTP_RANGE_FIELD_KEY &&
      fact.verificationStatus === "verified" &&
      typeof fact.numericValue === "number",
  ).length;

  const verifiedRealRangeFacts = facts.filter(
    (fact) =>
      fact.canonicalFieldKey === REAL_RANGE_FIELD_KEY &&
      fact.verificationStatus === "verified" &&
      typeof fact.numericValue === "number",
  ).length;

  const activeVariants = await db
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
      ),
    )
    .orderBy(vehicleBrands.name, vehicleModels.name, vehicleVariants.name);

  const verifiedWltpByVariant = new Map<string, number>();
  for (const fact of facts) {
    if (
      fact.canonicalFieldKey === WLTP_RANGE_FIELD_KEY &&
      fact.verificationStatus === "verified" &&
      typeof fact.numericValue === "number"
    ) {
      verifiedWltpByVariant.set(fact.variant, fact.numericValue);
    }
  }

  const variantsMissingWltp = activeVariants
    .filter((row) => !verifiedWltpByVariant.has(row.variant.name))
    .map((row) => ({
      brand: row.brand.name,
      model: row.model.name,
      variant: row.variant.name,
      batteryVariant: row.variant.batteryVariant,
    }));

  const ambiguousRangeFacts = facts
    .filter(
      (fact) =>
        fact.numericValue === null ||
        isLegacyRangeFieldKey(fact.fieldKey) ||
        fact.verificationStatus === "unverified",
    )
    .map((fact) => ({
      brand: fact.brand,
      model: fact.model,
      variant: fact.variant,
      fieldKey: fact.fieldKey,
      reason:
        fact.numericValue === null
          ? "missing_numeric_value"
          : isLegacyRangeFieldKey(fact.fieldKey)
            ? "legacy_field_key"
            : "unverified",
    }));

  const conflictGroups = new Map<string, number[]>();
  for (const fact of facts) {
    if (
      fact.canonicalFieldKey &&
      fact.verificationStatus === "verified" &&
      typeof fact.numericValue === "number"
    ) {
      const key = `${fact.variant}:${fact.canonicalFieldKey}`;
      const values = conflictGroups.get(key) ?? [];
      values.push(fact.numericValue);
      conflictGroups.set(key, values);
    }
  }

  const conflictingRangeFacts = [...conflictGroups.entries()]
    .filter(([, values]) => new Set(values).size > 1)
    .map(([key, values]) => {
      const [variant, fieldKey] = key.split(":");
      const fact = facts.find((row) => row.variant === variant && row.canonicalFieldKey === fieldKey);
      return {
        brand: fact?.brand ?? "",
        model: fact?.model ?? "",
        variant,
        fieldKey,
        values: [...new Set(values)],
      };
    });

  return {
    verifiedWltpFacts,
    verifiedRealRangeFacts,
    variantsMissingWltp,
    ambiguousRangeFacts,
    conflictingRangeFacts,
    facts,
  };
}
