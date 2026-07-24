import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import { getDatabaseUrl } from "@/lib/database-url";

import * as schema from "./schema";

export function createDb(databaseUrl = getDatabaseUrl()) {
  const sql = neon(databaseUrl);

  return drizzle(sql, { schema });
}
