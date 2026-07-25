import { config } from "dotenv";

import { countCatalogueStats } from "../../src/lib/catalogue/repositories/catalogue-repository";
import { validateCatalogue } from "../../src/lib/catalogue/validation";

config({ path: ".env.local" });

async function main() {
  const [stats, validation] = await Promise.all([
    countCatalogueStats(),
    validateCatalogue(),
  ]);

  console.log(
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        stats,
        validation,
        rangeMetrics: validation.rangeMetrics,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error("Catalogue report failed", error);
  process.exitCode = 1;
});
