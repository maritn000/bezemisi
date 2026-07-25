import assert from "node:assert/strict";
import test from "node:test";

import { EXPECTED_MIGRATION_TAGS } from "@/lib/catalogue/bootstrap/constants";

test("expected migration order starts with foundation then catalogue", () => {
  assert.deepEqual(EXPECTED_MIGRATION_TAGS, [
    "0000_redundant_wild_pack",
    "0001_woozy_expediter",
    "0002_model_level_specs",
  ]);
});

test("foundation migration contains no destructive statements", async () => {
  const sql = await import("node:fs/promises").then((fs) =>
    fs.readFile("drizzle/0000_redundant_wild_pack.sql", "utf8"),
  );

  assert.doesNotMatch(sql, /DROP\s+TABLE/i);
  assert.doesNotMatch(sql, /TRUNCATE/i);
});

test("model-level specs migration contains no destructive statements", async () => {
  const sql = await import("node:fs/promises").then((fs) =>
    fs.readFile("drizzle/0002_model_level_specs.sql", "utf8"),
  );

  assert.doesNotMatch(sql, /DROP\s+TABLE/i);
  assert.doesNotMatch(sql, /TRUNCATE/i);
});
