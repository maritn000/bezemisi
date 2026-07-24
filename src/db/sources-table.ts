import { sql } from "drizzle-orm";
import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const sources = pgTable(
  "sources",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    canonicalUrl: text("canonical_url"),
    sourceType: text("source_type").notNull(),
    publisher: text("publisher"),
    language: text("language").notNull().default("cs"),
    status: text("status").notNull().default("draft"),
    metadata: jsonb("metadata")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("sources_canonical_url_unique")
      .on(table.canonicalUrl)
      .where(sql`${table.canonicalUrl} is not null`),
    index("sources_status_idx").on(table.status),
    index("sources_language_idx").on(table.language),
  ],
);
