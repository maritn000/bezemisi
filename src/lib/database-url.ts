import { z } from "zod";

const KNOWN_DATABASE_URL_KEYS = [
  "DATABASE_URL",
  "POSTGRES_URL",
  "POSTGRES_URL_NON_POOLING",
  "POSTGRES_PRISMA_URL",
  "STORAGE_URL",
] as const;

const postgresUrlSchema = z
  .string()
  .min(1, "Database URL must not be empty")
  .refine(
    (value) => value.startsWith("postgres://") || value.startsWith("postgresql://"),
    "Database URL must be a PostgreSQL connection string",
  );

export type ResolvedDatabaseUrl = {
  url: string;
  sourceKey: string;
};

export function resolveDatabaseUrlFromEnv(
  env: NodeJS.ProcessEnv = process.env,
): ResolvedDatabaseUrl {
  for (const key of KNOWN_DATABASE_URL_KEYS) {
    const value = env[key];
    if (value) {
      return {
        url: postgresUrlSchema.parse(value),
        sourceKey: key,
      };
    }
  }

  for (const [key, value] of Object.entries(env)) {
    if (!value) {
      continue;
    }

    if (
      value.startsWith("postgres://") ||
      value.startsWith("postgresql://")
    ) {
      return {
        url: postgresUrlSchema.parse(value),
        sourceKey: key,
      };
    }
  }

  throw new Error(
    "Database URL is missing. Set a PostgreSQL connection string in your environment (for example DATABASE_URL or POSTGRES_URL).",
  );
}

export function getDatabaseUrl(env: NodeJS.ProcessEnv = process.env): string {
  return resolveDatabaseUrlFromEnv(env).url;
}

export function redactDatabaseUrl(url: string) {
  try {
    const parsed = new URL(url);
    return {
      host: parsed.hostname,
      database: parsed.pathname.replace(/^\//, ""),
      user: parsed.username ? "***" : null,
    };
  } catch {
    return {
      host: "unknown",
      database: "unknown",
      user: null,
    };
  }
}
