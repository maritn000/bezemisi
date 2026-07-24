import assert from "node:assert/strict";
import test from "node:test";

import {
  classifyDatabaseSchema,
  formatUnrelatedDatabaseReason,
} from "@/lib/catalogue/bootstrap/classify-database";

test("empty database is classified as empty", () => {
  const result = classifyDatabaseSchema({
    publicTables: [],
    applicationSchemas: [],
  });

  assert.equal(result.kind, "empty_database");
});

test("empty database with only drizzle migration journal schema is classified as empty", () => {
  const result = classifyDatabaseSchema({
    publicTables: [],
    applicationSchemas: [
      {
        schemaName: "drizzle",
        tables: ["__drizzle_migrations"],
      },
    ],
  });

  assert.equal(result.kind, "empty_database");
});

test("existing Bez emisí database is classified when foundation tables exist", () => {
  const result = classifyDatabaseSchema({
    publicTables: [
      "app_health_checks",
      "sources",
      "conversations",
      "messages",
      "vehicle_brands",
    ],
    applicationSchemas: [],
  });

  assert.equal(result.kind, "existing_bezemisi_database");
});

test("unrelated non-empty database is rejected when foundation is absent", () => {
  const result = classifyDatabaseSchema({
    publicTables: ["users", "orders"],
    applicationSchemas: [],
  });

  assert.equal(result.kind, "unrelated_nonempty_database");
  if (result.kind === "unrelated_nonempty_database") {
    assert.deepEqual(result.unexpectedTables, ["users", "orders"]);
    assert.deepEqual(result.unexpectedSchemas, []);
    assert.match(formatUnrelatedDatabaseReason(result), /users/);
  }
});

test("partial Bez emisí catalogue without foundation is rejected", () => {
  const result = classifyDatabaseSchema({
    publicTables: ["vehicle_brands", "vehicle_models"],
    applicationSchemas: [],
  });

  assert.equal(result.kind, "unrelated_nonempty_database");
  if (result.kind === "unrelated_nonempty_database") {
    assert.match(result.unexpectedTables.join(", "), /partial Bez emisí schema/);
  }
});

test("unexpected application schemas are rejected", () => {
  const result = classifyDatabaseSchema({
    publicTables: [],
    applicationSchemas: [
      {
        schemaName: "auth",
        tables: ["users"],
      },
    ],
  });

  assert.equal(result.kind, "unrelated_nonempty_database");
  if (result.kind === "unrelated_nonempty_database") {
    assert.deepEqual(result.unexpectedSchemas, ["auth"]);
  }
});

test("system schemas do not cause false unrelated classification", () => {
  const result = classifyDatabaseSchema({
    publicTables: [],
    applicationSchemas: [
      {
        schemaName: "pg_catalog",
        tables: ["pg_class"],
      },
      {
        schemaName: "information_schema",
        tables: ["tables"],
      },
    ],
  });

  assert.equal(result.kind, "empty_database");
});
