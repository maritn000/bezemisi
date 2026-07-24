import { runCatalogueBootstrap } from "@/lib/catalogue/bootstrap/run-bootstrap";

async function main() {
  const report = await runCatalogueBootstrap();

  if (!report.enabled) {
    return;
  }

  console.log(
    JSON.stringify(
      {
        success: report.success,
        stage: report.stage,
        database: report.database,
        counts: report.counts?.stats,
        completedIngestionRuns: report.counts?.completedIngestionRuns,
        warnings: report.warnings,
        errors: report.errors,
      },
      null,
      2,
    ),
  );

  if (!report.success) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error("Catalogue bootstrap failed", error);
  process.exitCode = 1;
});
