import { config } from "dotenv";

import { runPriceRepair } from "../../src/lib/catalogue/ingestion/repair-prices";

config({ path: ".env.local" });

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const summary = await runPriceRepair({ dryRun });

  console.log(
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        dryRun,
        summary,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error("Price repair failed", error);
  process.exitCode = 1;
});
