import { config } from "dotenv";

import {
  classifyDatabaseSchema,
  inspectDatabaseSchema,
} from "@/lib/catalogue/bootstrap/classify-database";
import { runDatabaseTargetPreflight } from "@/lib/catalogue/bootstrap/preflight";
import {
  runPendingCatalogueMigrations,
  verifyCatalogueSchema,
  verifyFoundationSchema,
} from "@/lib/catalogue/bootstrap/schema";
import { redactDatabaseUrl, resolveDatabaseUrlFromEnv } from "@/lib/database-url";

config({ path: ".env.local" });

function printNextSteps() {
  console.log("");
  console.log("Database is ready for catalogue bootstrap. Next steps:");
  console.log("1. In Vercel → Settings → Environment Variables (Production):");
  console.log("   set RUN_CATALOGUE_BOOTSTRAP=true");
  console.log("2. Redeploy Production.");
  console.log("3. After a successful deploy, remove RUN_CATALOGUE_BOOTSTRAP or set it to false.");
  console.log("4. Redeploy Production again.");
}

async function main() {
  let resolved;
  try {
    resolved = resolveDatabaseUrlFromEnv();
  } catch {
    console.error(
      "Database URL is missing. Run: npx vercel env pull .env.local --environment=production",
    );
    process.exitCode = 1;
    return;
  }

  const redacted = redactDatabaseUrl(resolved.url);
  const inventory = await inspectDatabaseSchema(resolved.url);
  const classification = classifyDatabaseSchema(inventory);

  console.log(
    JSON.stringify(
      {
        step: "classification",
        sourceKey: resolved.sourceKey,
        host: redacted.host,
        database: redacted.database,
        classification: classification.kind,
      },
      null,
      2,
    ),
  );

  const preflight = await runDatabaseTargetPreflight();
  if (!preflight.ok) {
    console.error(
      JSON.stringify(
        {
          step: "preflight",
          status: "failed",
          classification: preflight.classification,
          reason: preflight.reason,
        },
        null,
        2,
      ),
    );
    process.exitCode = 1;
    return;
  }

  if (
    preflight.classification === "existing_bezemisi_database" &&
  (await verifyFoundationSchema(resolved.url)).ok &&
    (await verifyCatalogueSchema(resolved.url)).ok
  ) {
    console.log(JSON.stringify({ step: "verify", status: "ready" }, null, 2));
    printNextSteps();
    return;
  }

  console.log("Applying pending Drizzle migrations...");
  try {
    await runPendingCatalogueMigrations(resolved.url);
  } catch (error) {
    console.error(
      "Migration failed:",
      error instanceof Error ? error.message : error,
    );
    process.exitCode = 1;
    return;
  }

  const foundation = await verifyFoundationSchema(resolved.url);
  const catalogue = await verifyCatalogueSchema(resolved.url);

  if (!foundation.ok || !catalogue.ok) {
    console.error(
      JSON.stringify(
        {
          step: "verify",
          status: "failed",
          foundation,
          catalogue,
        },
        null,
        2,
      ),
    );
    process.exitCode = 1;
    return;
  }

  console.log(JSON.stringify({ step: "verify", status: "ready" }, null, 2));
  printNextSteps();
}

main().catch((error) => {
  console.error("Prepare catalogue bootstrap failed", error);
  process.exitCode = 1;
});
