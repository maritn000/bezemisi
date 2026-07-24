import { config } from "dotenv";

import { runIngestion } from "../../src/lib/catalogue/ingestion/run-ingestion";

config({ path: ".env.local" });

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const summary = await runIngestion({ dryRun });
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error("Catalogue ingestion failed", error);
  process.exitCode = 1;
});
