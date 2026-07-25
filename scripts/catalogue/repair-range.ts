import { config } from "dotenv";

import { runRangeRepair } from "../../src/lib/catalogue/ingestion/repair-range";

config({ path: ".env.local" });

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const summary = await runRangeRepair({ dryRun });

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

  if (!dryRun && summary.warningsCount > 0) {
    process.exitCode = 0;
  }
}

main().catch((error) => {
  console.error("Range repair failed", error);
  process.exitCode = 1;
});
