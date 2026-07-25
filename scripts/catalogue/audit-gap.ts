#!/usr/bin/env tsx
import "dotenv/config";

import { config } from "dotenv";
import { writeFile } from "node:fs/promises";
import { eq, sql } from "drizzle-orm";

config({ path: ".env.local" });

import { createDb } from "@/db/create-client";
import { getNormalizedDatabaseUrl } from "@/env";
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
import { BEZEMISI_BASE_URL } from "@/lib/catalogue/constants";
import { listPresentedModels } from "@/lib/catalogue/repositories/catalogue-repository";

async function main() {
  const db = createDb(getNormalizedDatabaseUrl());

  const counts = {
    brands: await countTable(db, vehicleBrands),
    models: await countTable(db, vehicleModels),
    variants: await countTable(db, vehicleVariants),
    specifications: await countTable(db, vehicleSpecifications),
    modelSpecifications: await countTable(db, vehicleModelSpecifications),
    offers: await countTable(db, vehicleOffers),
    sourcePages: await countTable(db, sourcePages),
    commercialConditions: await countTable(db, commercialConditions),
    ingestionIssues: await countTable(db, catalogueIngestionIssues),
  };

  const models = await listPresentedModels();
  const matrix: string[] = [
    "# Full catalogue gap audit",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    "## Aggregate counts",
    "",
    "| Entity | Count |",
    "| --- | ---: |",
    ...Object.entries(counts).map(([key, value]) => `| ${key} | ${value} |`),
    "",
    "## Per-model coverage matrix",
    "",
    "| Brand | Model | Price | WLTP range | Battery | DC charging | Power | Boot | Dimensions | Image | Current offer | Source |",
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |",
  ];

  for (const { model, brand } of models) {
    const variantRows = await db
      .select()
      .from(vehicleVariants)
      .where(eq(vehicleVariants.modelId, model.id));
    const variantIds = variantRows.map((row) => row.id);

    const variantSpecs =
      variantIds.length > 0
        ? await db
            .select()
            .from(vehicleSpecifications)
            .where(sql`${vehicleSpecifications.variantId} in ${variantIds}`)
        : [];

    const modelSpecs = await db
      .select()
      .from(vehicleModelSpecifications)
      .where(eq(vehicleModelSpecifications.modelId, model.id));

    const offers =
      variantIds.length > 0
        ? await db
            .select()
            .from(vehicleOffers)
            .where(
              sql`${vehicleOffers.isCurrent} = true and (${vehicleOffers.modelId} = ${model.id} or ${vehicleOffers.variantId} in (${sql.join(
                variantIds.map((id) => sql`${id}`),
                sql`, `,
              )}))`,
            )
        : await db
            .select()
            .from(vehicleOffers)
            .where(
              sql`${vehicleOffers.isCurrent} = true and ${vehicleOffers.modelId} = ${model.id}`,
            );

    const sources = await db
      .select()
      .from(sourcePages)
      .where(sql`${sourcePages.url} like ${`%${brand.slug}/${model.slug}%`}`);

    const has = (field: string, rows = variantSpecs) =>
      rows.some((row) => row.fieldKey === field) ? "yes" : "no";
    const hasModel = (field: string) =>
      modelSpecs.some((row) => row.fieldKey === field) ? "yes" : "no";

    matrix.push(
      `| ${brand.name} | ${model.name} | ${hasModel("published_starting_price_czk") === "yes" || hasModel("published_price_unavailable") === "yes" ? "yes" : "no"} | ${hasModel("published_model_max_wltp_range_km") === "yes" || has("wltp_range_km") === "yes" ? "yes" : "no"} | ${has("battery_capacity_usable_kwh")} | ${has("max_dc_charging_kw")} | ${has("power_kw")} | ${has("boot_capacity_l")} | ${has("length_mm") === "yes" && has("width_mm") === "yes" ? "yes" : "no"} | ${model.mainImagePath && model.mainImagePath !== "/ev-placeholder.svg" ? "yes" : "no"} | ${offers.length > 0 ? "yes" : "no"} | ${sources.length > 0 ? "yes" : "no"} |`,
    );
  }

  const output = matrix.join("\n");
  await writeFile("docs/full-catalogue-gap-audit.md", output, "utf8");
  console.log(output);
}

async function countTable(
  db: ReturnType<typeof createDb>,
  table:
    | typeof vehicleBrands
    | typeof vehicleModels
    | typeof vehicleVariants
    | typeof vehicleSpecifications
    | typeof vehicleModelSpecifications
    | typeof vehicleOffers
    | typeof sourcePages
    | typeof commercialConditions
    | typeof catalogueIngestionIssues,
) {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(table);
  return row?.count ?? 0;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
