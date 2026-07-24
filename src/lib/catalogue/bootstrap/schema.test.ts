import assert from "node:assert/strict";
import test from "node:test";

import { EXPECTED_MIGRATION_TAGS } from "@/lib/catalogue/bootstrap/constants";

test("expected migration order starts with foundation then catalogue", () => {
  assert.deepEqual(EXPECTED_MIGRATION_TAGS, [
    "0000_redundant_wild_pack",
    "0001_woozy_expediter",
  ]);
});

test("foundation migration contains no destructive statements", async () => {
  const sql = await import("node:fs/promises").then((fs) =>
    fs.readFile("drizzle/0000_redundant_wild_pack.sql", "utf8"),
  );

  assert.doesNotMatch(sql, /DROP\s+TABLE/i);
  assert.doesNotMatch(sql, /TRUNCATE/i);
});

test("catalogue migration contains no destructive statements", async () => {
  const sql = await import("node:fs/promises").then((fs) =>
    fs.readFile("drizzle/0001_woozy_expediter.sql", "utf8"),
  );

  assert.doesNotMatch(sql, /DROP\s+TABLE/i);
  assert.doesNotMatch(sql, /TRUNCATE/i);
});
