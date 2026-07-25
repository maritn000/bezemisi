import { and, eq, or, sql } from "drizzle-orm";

import { createDb } from "@/db/create-client";
import {
  catalogueIngestionIssues,
  catalogueIngestionRuns,
  sourcePages,
  vehicleBrands,
  vehicleModels,
  vehicleSpecifications,
  vehicleVariants,
} from "@/db/schema";
import { getNormalizedDatabaseUrl } from "@/env";
import {
  RANGE_FIELD_KEYS,
  type RangeFieldKey,
} from "../constants";
import {
  canonicalizeRangeFieldKey,
  isLegacyRangeFieldKey,
  parseRangeNumericValue,
} from "../range-field-keys";

import { detectSpecConflict } from "./conflict-detection";
import { VERIFIED_VARIANT_SEEDS, type SeedSpec } from "./seed-data";

const OBSERVED_AT = new Date("2026-07-24T12:00:00.000Z");

export type RangeRepairSummary = {
  runId: string;
  dryRun: boolean;
  variantsProcessed: number;
  rangeFactsCreated: number;
  rangeFactsUpdated: number;
  legacyKeysNormalized: number;
  legacyKeysSkippedDueToConflict: number;
  ambiguousFactsRecorded: number;
  warningsCount: number;
};

let repairDb: ReturnType<typeof createDb> | null = null;

function getRepairDb() {
  if (!repairDb) {
    repairDb = createDb(getNormalizedDatabaseUrl());
  }
  return repairDb;
}

async function upsertSourcePage(spec: SeedSpec) {
  const db = getRepairDb();
  const [existing] = await db
    .select()
    .from(sourcePages)
    .where(eq(sourcePages.url, spec.sourceUrl))
    .limit(1);

  if (existing) {
    return existing;
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

async function upsertRangeSpecification(
  variantId: string,
  spec: SeedSpec,
  runId: string,
  counters: Pick<
    RangeRepairSummary,
    "dryRun" | "rangeFactsCreated" | "rangeFactsUpdated" | "warningsCount"
  >,
) {
  const db = getRepairDb();
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
  const valueType = "number";

  if (existing) {
    if (!counters.dryRun) {
      await db
        .update(vehicleSpecifications)
        .set({
          numericValue: String(spec.value),
          textValue: null,
          booleanValue: null,
          unit: spec.unit ?? null,
          valueType,
          verificationStatus,
          observedAt: OBSERVED_AT,
          verifiedAt: OBSERVED_AT,
          notes: spec.notes ?? null,
          updatedAt: new Date(),
        })
        .where(eq(vehicleSpecifications.id, existing.id));
    }
    counters.rangeFactsUpdated += 1;
  } else if (!counters.dryRun) {
    await db.insert(vehicleSpecifications).values({
      variantId,
      fieldKey: spec.fieldKey,
      numericValue: String(spec.value),
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
    counters.rangeFactsCreated += 1;
  } else {
    counters.rangeFactsCreated += 1;
  }

  if (conflict.hasConflict) {
    counters.warningsCount += 1;
    if (!counters.dryRun) {
      await db.insert(catalogueIngestionIssues).values({
        ingestionRunId: runId,
        sourcePageId: sourcePage.id,
        entityType: "vehicle_specification",
        entityIdentifier: `${variantId}:${spec.fieldKey}`,
        fieldKey: spec.fieldKey,
        issueType: "conflicting_values",
        severity: "warning",
        message: `Konflikt hodnot pro ${spec.fieldKey} při opravě dojezdu`,
        metadata: {
          existingValue: conflict.existingValue,
          incomingValue: conflict.incomingValue,
        },
      });
    }
  }
}

async function normalizeLegacyRangeFacts(
  runId: string,
  counters: Pick<
    RangeRepairSummary,
    | "legacyKeysNormalized"
    | "legacyKeysSkippedDueToConflict"
    | "ambiguousFactsRecorded"
    | "warningsCount"
  > & { dryRun: boolean },
) {
  const db = getRepairDb();
  const legacySpecs = await db
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
      or(
        sql`lower(${vehicleSpecifications.fieldKey}) like '%range%'`,
        sql`lower(${vehicleSpecifications.fieldKey}) like '%dojezd%'`,
        sql`lower(${vehicleSpecifications.fieldKey}) like '%wltp%'`,
      ),
    );

  for (const row of legacySpecs) {
    const canonicalKey = canonicalizeRangeFieldKey(row.spec.fieldKey);
    if (!canonicalKey || canonicalKey === row.spec.fieldKey) {
      continue;
    }

    if (!isLegacyRangeFieldKey(row.spec.fieldKey)) {
      continue;
    }

    const numericValue = parseRangeNumericValue(row.spec);
    if (numericValue === null) {
      counters.ambiguousFactsRecorded += 1;
      if (!counters.dryRun) {
        await db.insert(catalogueIngestionIssues).values({
          ingestionRunId: runId,
          sourcePageId: row.page.id,
          entityType: "vehicle_specification",
          entityIdentifier: `${row.variant.id}:${row.spec.fieldKey}`,
          fieldKey: row.spec.fieldKey,
          issueType: "ambiguous_value",
          severity: "warning",
          message:
            "Legacy klíč dojezdu nelze normalizovat kvůli chybějící nebo neplatné numerické hodnotě.",
        });
      }
      continue;
    }

    const [canonicalExisting] = await db
      .select()
      .from(vehicleSpecifications)
      .where(
        and(
          eq(vehicleSpecifications.variantId, row.variant.id),
          eq(vehicleSpecifications.fieldKey, canonicalKey),
          eq(vehicleSpecifications.sourcePageId, row.page.id),
        ),
      )
      .limit(1);

    if (
      canonicalExisting &&
      parseRangeNumericValue(canonicalExisting) !== numericValue
    ) {
      counters.legacyKeysSkippedDueToConflict += 1;
      counters.warningsCount += 1;
      if (!counters.dryRun) {
        await db.insert(catalogueIngestionIssues).values({
          ingestionRunId: runId,
          sourcePageId: row.page.id,
          entityType: "vehicle_specification",
          entityIdentifier: `${row.variant.id}:${row.spec.fieldKey}`,
          fieldKey: row.spec.fieldKey,
          issueType: "conflicting_values",
          severity: "warning",
          message:
            "Legacy klíč dojezdu nebyl sloučen, protože kanonický fakt už existuje s jinou hodnotou.",
          metadata: {
            canonicalKey,
            legacyValue: numericValue,
            canonicalValue: parseRangeNumericValue(canonicalExisting),
          },
        });
      }
      continue;
    }

    if (!canonicalExisting && !counters.dryRun) {
      await db.insert(vehicleSpecifications).values({
        variantId: row.variant.id,
        fieldKey: canonicalKey,
        numericValue: String(numericValue),
        unit: row.spec.unit ?? "km",
        valueType: "number",
        sourcePageId: row.page.id,
        verificationStatus:
          row.spec.verificationStatus === "verified" ? "verified" : "unverified",
        sourcePriority: row.spec.sourcePriority,
        observedAt: row.spec.observedAt ?? OBSERVED_AT,
        verifiedAt: row.spec.verifiedAt,
        notes: `Normalizováno z legacy klíče ${row.spec.fieldKey}`,
      });
    }

    if (!counters.dryRun) {
      await db
        .update(vehicleSpecifications)
        .set({
          verificationStatus: "stale",
          notes: `Nahrazeno kanonickým klíčem ${canonicalKey}`,
          updatedAt: new Date(),
        })
        .where(eq(vehicleSpecifications.id, row.spec.id));
    }

    counters.legacyKeysNormalized += 1;
  }
}

function isRangeSeedSpec(spec: SeedSpec): spec is SeedSpec & {
  fieldKey: RangeFieldKey;
  value: number;
} {
  return (
    (RANGE_FIELD_KEYS as readonly string[]).includes(spec.fieldKey) &&
    typeof spec.value === "number" &&
    spec.value > 0
  );
}

export async function runRangeRepair(options: {
  dryRun?: boolean;
} = {}): Promise<RangeRepairSummary> {
  const dryRun = options.dryRun ?? false;
  const counters: RangeRepairSummary = {
    runId: dryRun ? "dry-run" : "",
    dryRun,
    variantsProcessed: 0,
    rangeFactsCreated: 0,
    rangeFactsUpdated: 0,
    legacyKeysNormalized: 0,
    legacyKeysSkippedDueToConflict: 0,
    ambiguousFactsRecorded: 0,
    warningsCount: 0,
  };

  if (dryRun) {
    for (const modelSeed of VERIFIED_VARIANT_SEEDS) {
      for (const variantSeed of modelSeed.variants) {
        counters.variantsProcessed += 1;
        counters.rangeFactsCreated += variantSeed.specs.filter(isRangeSeedSpec).length;
      }
    }
    return counters;
  }

  const db = getRepairDb();
  const [run] = await db
    .insert(catalogueIngestionRuns)
    .values({
      runType: "range_repair",
      status: "running",
      startedAt: new Date(),
    })
    .returning();

  counters.runId = run!.id;

  try {
    for (const modelSeed of VERIFIED_VARIANT_SEEDS) {
      const [brand] = await db
        .select()
        .from(vehicleBrands)
        .where(eq(vehicleBrands.slug, modelSeed.brandSlug))
        .limit(1);
      if (!brand) continue;

      const [model] = await db
        .select()
        .from(vehicleModels)
        .where(
          and(
            eq(vehicleModels.brandId, brand.id),
            eq(vehicleModels.slug, modelSeed.modelSlug),
          ),
        )
        .limit(1);
      if (!model) continue;

      for (const variantSeed of modelSeed.variants) {
        const [variant] = await db
          .select()
          .from(vehicleVariants)
          .where(
            and(
              eq(vehicleVariants.modelId, model.id),
              eq(vehicleVariants.slug, variantSeed.slug),
            ),
          )
          .limit(1);
        if (!variant) continue;

        counters.variantsProcessed += 1;

        for (const spec of variantSeed.specs.filter(isRangeSeedSpec)) {
          await upsertRangeSpecification(variant.id, spec, counters.runId, counters);
        }
      }
    }

    await normalizeLegacyRangeFacts(counters.runId, counters);

    await db
      .update(catalogueIngestionRuns)
      .set({
        status:
          counters.warningsCount > 0 ? "completed_with_warnings" : "completed",
        completedAt: new Date(),
        factsCreated: counters.rangeFactsCreated,
        factsUpdated: counters.rangeFactsUpdated,
        warningsCount: counters.warningsCount,
        updatedAt: new Date(),
        metadata: {
          legacyKeysNormalized: counters.legacyKeysNormalized,
          legacyKeysSkippedDueToConflict: counters.legacyKeysSkippedDueToConflict,
          ambiguousFactsRecorded: counters.ambiguousFactsRecorded,
        },
      })
      .where(eq(catalogueIngestionRuns.id, counters.runId));
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
      .where(eq(catalogueIngestionRuns.id, counters.runId));
    throw error;
  }

  return counters;
}
