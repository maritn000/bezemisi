import { config } from "dotenv";

import { validateCatalogue } from "../../src/lib/catalogue/validation";

config({ path: ".env.local" });

async function main() {
  const result = await validateCatalogue();
  console.log(JSON.stringify(result, null, 2));
  if (!result.valid) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error("Catalogue validation failed", error);
  process.exitCode = 1;
});
