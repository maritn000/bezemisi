import { config } from "dotenv";

import { FOUNDATION_TABLES } from "@/lib/catalogue/bootstrap/constants";
import { runDatabaseTargetPreflight } from "@/lib/catalogue/bootstrap/preflight";
import { runPendingCatalogueMigrations } from "@/lib/catalogue/bootstrap/schema";
import { redactDatabaseUrl, resolveDatabaseUrlFromEnv } from "@/lib/database-url";

config({ path: ".env.local" });

function printNextSteps() {
  console.log("");
  console.log("Foundation tables are ready. Next steps:");
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
  console.log(
    JSON.stringify(
      {
        step: "target",
        sourceKey: resolved.sourceKey,
        host: redacted.host,
        database: redacted.database,
        requiredFoundationTables: [...FOUNDATION_TABLES],
      },
      null,
      2,
    ),
  );

  let preflight = await runDatabaseTargetPreflight();
  if (preflight.ok) {
    console.log(JSON.stringify({ step: "preflight", status: "ready" }, null, 2));
    printNextSteps();
    return;
  }

  console.log(
    JSON.stringify(
      {
        step: "preflight",
        status: "foundation_missing",
        reason: preflight.reason,
      },
      null,
      2,
    ),
  );

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

  preflight = await runDatabaseTargetPreflight();
  if (!preflight.ok) {
    console.error(
      JSON.stringify(
        {
          step: "verify",
          status: "failed",
          reason: preflight.reason,
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
