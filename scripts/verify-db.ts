import { config } from "dotenv";

import { verifyDatabaseReadWrite } from "../src/lib/db/verify-database";

config({ path: ".env.local" });

async function main() {
  const result = await verifyDatabaseReadWrite();

  if (!result.success) {
    console.error("Database verification failed:", result.error ?? "Unknown error");
    process.exitCode = 1;
    return;
  }

  console.log("Database verification succeeded.");
  console.log(`Health check id: ${result.healthCheckId}`);
  console.log(`Health check status: ${result.status}`);
}

main().catch((error) => {
  console.error("Database verification script failed", error);
  process.exitCode = 1;
});
