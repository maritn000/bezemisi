#!/usr/bin/env tsx
import "dotenv/config";

import { config } from "dotenv";

config({ path: ".env.local" });

import { runFullCatalogueIngestion } from "@/lib/catalogue/ingestion/full/run-full-ingestion";

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const resume = !process.argv.includes("--no-resume");

  const summary = await runFullCatalogueIngestion({ dryRun, resume });
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
