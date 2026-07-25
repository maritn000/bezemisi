import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

import { config } from "dotenv";
import { sql } from "drizzle-orm";

import { createDb } from "../src/db/create-client";
import { getDatabaseUrlSourceKey } from "../src/env";
import { redactDatabaseUrl, resolveDatabaseUrlFromEnv } from "../src/lib/database-url";

config({ path: ".env.local" });

const ROOT = path.resolve(__dirname, "..");

const REQUIRED_ROUTES = [
  "/",
  "/elektromobily",
  "/elektromobily/hyundai/inster",
  "/elektromobily/volvo/ex30",
  "/elektromobily/kia/ev3",
  "/akcni-nabidky",
  "/jak-vybrat",
  "/nabijeni",
  "/blog",
  "/o-nas",
  "/kontakt",
  "/chat",
  "/mapa-stranek",
  "/operativni-leasing",
] as const;

const REQUIRED_STATIC_ASSETS = [
  "public/hero/home-hero.png",
  "public/sections/city.jpg",
  "public/sections/guide.jpg",
  "public/sections/charging.jpg",
  "public/sections/about-team.webp",
  "public/vehicles/hyundai-inster.jpg",
  "public/vehicles/volvo-ex30.jpg",
  "public/vehicles/kia-ev3.jpg",
  "public/blog/nejlevnejsi-elektromobily.jpg",
  "public/blog/degradace-baterie.webp",
  "public/blog/baterie-zaruka-servis.webp",
  "public/brand/bezemisi-favicon.png",
  "public/ev-placeholder.svg",
] as const;

const REQUIRED_ENV_VARS = [
  "DATABASE_URL",
  "OPENAI_API_KEY",
  "CATALOGUE_ADMIN_TOKEN",
] as const;

const OPTIONAL_ENV_VARS = ["OPENAI_CHAT_MODEL"] as const;

const PLACEHOLDER_PATTERNS = [
  /prototypový formulář/i,
  /v tomto prototypu/i,
  /pouze ukázkou/i,
  /Odeslat \(prototyp\)/i,
] as const;

const CATALOGUE_TABLES = [
  "vehicle_brands",
  "vehicle_models",
  "vehicle_variants",
  "vehicle_specifications",
  "vehicle_offers",
  "commercial_conditions",
  "source_pages",
  "catalogue_ingestion_runs",
  "catalogue_ingestion_issues",
] as const;

type CheckResult = {
  name: string;
  ok: boolean;
  detail?: string;
};

const results: CheckResult[] = [];

function record(name: string, ok: boolean, detail?: string) {
  results.push({ name, ok, detail });
}

function checkStaticAssets() {
  for (const asset of REQUIRED_STATIC_ASSETS) {
    const absolutePath = path.join(ROOT, asset);
    if (!existsSync(absolutePath)) {
      record(`asset:${asset}`, false, "missing");
      continue;
    }

    const size = statSync(absolutePath).size;
    if (size <= 0) {
      record(`asset:${asset}`, false, "empty file");
      continue;
    }

    const content = readFileSync(absolutePath);
    const header = content.subarray(0, 32).toString("utf8");
    if (header.startsWith("version https://git-lfs.github.com/spec/v1")) {
      record(`asset:${asset}`, false, "git-lfs pointer instead of binary");
      continue;
    }

    record(`asset:${asset}`, true, `${size} bytes`);
  }
}

function checkRoutesPresent() {
  const appDir = path.join(ROOT, "src/app");
  const routeMap: Record<string, string> = {
    "/": path.join(appDir, "page.tsx"),
    "/elektromobily": path.join(appDir, "elektromobily/page.tsx"),
    "/elektromobily/hyundai/inster": path.join(
      appDir,
      "elektromobily/[brand]/[model]/page.tsx",
    ),
    "/akcni-nabidky": path.join(appDir, "akcni-nabidky/page.tsx"),
    "/jak-vybrat": path.join(appDir, "jak-vybrat/page.tsx"),
    "/nabijeni": path.join(appDir, "nabijeni/page.tsx"),
    "/blog": path.join(appDir, "blog/page.tsx"),
    "/o-nas": path.join(appDir, "o-nas/page.tsx"),
    "/kontakt": path.join(appDir, "kontakt/page.tsx"),
    "/chat": path.join(appDir, "chat/page.tsx"),
    "/mapa-stranek": path.join(appDir, "mapa-stranek/page.tsx"),
    "/operativni-leasing": path.join(appDir, "operativni-leasing/page.tsx"),
  };

  for (const route of REQUIRED_ROUTES) {
    const filePath = routeMap[route];
    if (!filePath || !existsSync(filePath)) {
      record(`route:${route}`, false, "page source missing");
      continue;
    }
    record(`route:${route}`, true);
  }
}

function checkEnvironmentVariables() {
  for (const name of REQUIRED_ENV_VARS) {
    const value = process.env[name]?.trim();
    record(`env:${name}`, Boolean(value), value ? "configured" : "missing");
  }

  for (const name of OPTIONAL_ENV_VARS) {
    const value = process.env[name]?.trim();
    record(
      `env:${name}`,
      true,
      value ? "configured" : "optional default will be used",
    );
  }

  const bootstrap = process.env.RUN_CATALOGUE_BOOTSTRAP?.trim().toLowerCase();
  record(
    "env:RUN_CATALOGUE_BOOTSTRAP",
    bootstrap !== "true",
    bootstrap === "true" ? "must be disabled for normal release" : "disabled",
  );
}

function checkPlaceholderText() {
  const files = [
    "src/app/page.tsx",
    "src/components/site/footer.tsx",
    "src/components/site/inquiry-form.tsx",
    "src/lib/site-content.ts",
  ];

  for (const relativePath of files) {
    const absolutePath = path.join(ROOT, relativePath);
    if (!existsSync(absolutePath)) {
      record(`placeholder:${relativePath}`, false, "file missing");
      continue;
    }

    const content = readFileSync(absolutePath, "utf8");
    const match = PLACEHOLDER_PATTERNS.find((pattern) => pattern.test(content));
    record(
      `placeholder:${relativePath}`,
      !match,
      match ? `matched ${match}` : "clean",
    );
  }
}

async function checkCatalogueReadOnly() {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    record("catalogue:schema", false, "DATABASE_URL not configured");
    return;
  }

  try {
    const resolved = resolveDatabaseUrlFromEnv();
    const redacted = redactDatabaseUrl(resolved.url);
    record(
      "catalogue:database",
      true,
      `${getDatabaseUrlSourceKey()} -> ${redacted.database ?? "unknown"}`,
    );

    const db = createDb();
    const tables = await db.execute(sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    const tableNames = tables.rows.map((row) => String(row.table_name));

    for (const table of CATALOGUE_TABLES) {
      record(`catalogue:table:${table}`, tableNames.includes(table));
    }

    const cermatTables = tableNames.filter((name) =>
      name.toLowerCase().includes("cermat"),
    );
    record("catalogue:no-cermat-tables", cermatTables.length === 0);

    const counts: Record<string, number> = {};
    for (const table of CATALOGUE_TABLES) {
      if (!tableNames.includes(table)) continue;
      const result = await db.execute(
        sql.raw(`SELECT COUNT(*)::int AS count FROM "${table}"`),
      );
      counts[table] = Number(result.rows[0]?.count ?? 0);
    }

    record(
      "catalogue:row-counts",
      Object.values(counts).some((count) => count > 0),
      JSON.stringify(counts),
    );

    if (tableNames.includes("catalogue_ingestion_runs")) {
      const latestRun = await db.execute(sql`
        SELECT id, status, started_at, finished_at
        FROM catalogue_ingestion_runs
        ORDER BY started_at DESC
        LIMIT 1
      `);
      record(
        "catalogue:latest-ingestion-run",
        latestRun.rows.length > 0,
        JSON.stringify(latestRun.rows[0] ?? null),
      );
    }
  } catch (error) {
    record(
      "catalogue:schema",
      false,
      error instanceof Error ? error.message : "unknown error",
    );
  }
}

async function main() {
  checkStaticAssets();
  checkRoutesPresent();
  checkEnvironmentVariables();
  checkPlaceholderText();
  await checkCatalogueReadOnly();

  const failed = results.filter((result) => !result.ok);
  const summary = {
    ok: failed.length === 0,
    passed: results.length - failed.length,
    failed: failed.length,
    results,
  };

  console.log(JSON.stringify(summary, null, 2));
  if (failed.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error("Deployment verification failed", error);
  process.exitCode = 1;
});
