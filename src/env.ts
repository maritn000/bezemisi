import "server-only";

import { z } from "zod";

import {
  getDatabaseUrl,
  resolveDatabaseUrlFromEnv,
} from "@/lib/database-url";

const serverEnvSchema = z.object({
  databaseUrl: z
    .string()
    .min(1, "DATABASE_URL is required")
    .refine(
      (value) =>
        value.startsWith("postgres://") || value.startsWith("postgresql://"),
      "DATABASE_URL must be a PostgreSQL connection string",
    ),
  databaseUrlSourceKey: z.string().min(1),
});

type ServerEnv = z.infer<typeof serverEnvSchema>;

let cachedEnv: ServerEnv | null = null;

function loadServerEnv(): ServerEnv {
  if (cachedEnv) {
    return cachedEnv;
  }

  const resolved = resolveDatabaseUrlFromEnv();

  cachedEnv = serverEnvSchema.parse({
    databaseUrl: getDatabaseUrl(),
    databaseUrlSourceKey: resolved.sourceKey,
  });

  return cachedEnv;
}

export function getNormalizedDatabaseUrl(): string {
  return loadServerEnv().databaseUrl;
}

export function getDatabaseUrlSourceKey(): string {
  return loadServerEnv().databaseUrlSourceKey;
}

export const env = new Proxy({} as ServerEnv, {
  get(_target, property) {
    return loadServerEnv()[property as keyof ServerEnv];
  },
});
