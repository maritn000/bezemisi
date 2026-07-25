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
  const models = await listPresentedModels();

  const lines = [
    "# Full catalogue coverage report",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    "| Brand | Model | Live URL | Image | Starting price | Model-level max WLTP | Variants | Battery | DC | AC | Power | Boot | Dimensions | Current offers | Leasing | Sources | Issues |",
    "| --- | --- | --- | --- | --- | --- | ---: | --- | --- | --- | --- | --- | --- | --- | --- | ---: | --- |",
  ];

  for (const { model, brand } of models) {
    const liveUrl = `${BEZEMISI_BASE_URL}/elektromobily/${brand.slug}/${model.slug}`;
    const variants = await db
      .select()
      .from(vehicleVariants)
      .where(eq(vehicleVariants.modelId, model.id));
    const variantIds = variants.map((row) => row.id);
    const specs =
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
      .where(sql`${sourcePages.url} like ${`%${brand.slug}%`} and ${sourcePages.url} like ${`%${model.slug}%`}`);
    const leasing = await db
      .select()
      .from(commercialConditions)
      .where(eq(commercialConditions.conditionType, "operating_lease"));
    const issues = await db
      .select()
      .from(catalogueIngestionIssues)
      .where(sql`${catalogueIngestionIssues.entityIdentifier} like ${`%${brand.slug}/${model.slug}%`}`);

    const yes = (field: string, rows = specs) =>
      rows.some((row) => row.fieldKey === field) ? "yes" : "no";
    const modelValue = (field: string) => {
      const row = modelSpecs.find((spec) => spec.fieldKey === field);
      if (!row) return "—";
      if (row.valueType === "boolean" && row.booleanValue) return "unavailable";
      return row.numericValue ?? row.textValue ?? "—";
    };

    lines.push(
      `| ${brand.name} | ${model.name} | ${liveUrl} | ${model.mainImagePath && model.mainImagePath !== "/ev-placeholder.svg" ? "yes" : "placeholder"} | ${modelValue("published_starting_price_czk")} | ${modelValue("published_model_max_wltp_range_km")} | ${variants.length} | ${yes("battery_capacity_usable_kwh")} | ${yes("max_dc_charging_kw")} | ${yes("max_ac_charging_kw")} | ${yes("power_kw")} | ${yes("boot_capacity_l")} | ${yes("length_mm")} | ${offers.length} | ${leasing.length > 0 ? "yes" : "no"} | ${sources.length} | ${issues.length} |`,
    );
  }

  const output = lines.join("\n");
  await writeFile("docs/full-catalogue-coverage-report.md", output, "utf8");
  console.log(output);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
