import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

import { resolveDatabaseUrlFromEnv } from "./src/lib/database-url";

config({ path: ".env.local" });

function getConfigDatabaseUrl(): string {
  try {
    return resolveDatabaseUrlFromEnv().url;
  } catch {
    // drizzle-kit generate only needs the schema; a placeholder is enough locally.
    return "postgresql://placeholder:placeholder@localhost:5432/placeholder";
  }
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: getConfigDatabaseUrl(),
  },
});
