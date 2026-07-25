import assert from "node:assert/strict";
import test from "node:test";

import { normalizeVehicleTitle } from "@/lib/catalogue/source-title";
import {
  containsInternalIdentifier,
  stripInternalIdentifiers,
} from "@/lib/chat/output-safeguard";
import {
  buildGroundedChatContext,
  deduplicateVerifiedSources,
  type RetrievalResult,
} from "@/lib/chat/grounding";

test("normalizeVehicleTitle removes duplicated brand prefix", () => {
  assert.equal(
    normalizeVehicleTitle("Hyundai", "IONIQ 2", "Hyundai Hyundai IONIQ 2"),
    "Hyundai IONIQ 2",
  );
  assert.equal(
    normalizeVehicleTitle("Kia", "EV3", "Kia Kia EV3"),
    "Kia EV3",
  );
  assert.equal(
    normalizeVehicleTitle("Opel", "Grandland Electric", "Opel Opel Grandland Electric"),
    "Opel Grandland Electric",
  );
});

test("stripInternalIdentifiers removes UUIDs but keeps readable text", () => {
  const input =
    "BMW iX1 – 1 133 000 Kč [2bb67414-5aef-4c84-b1c0-6f92c051c040]";
  const output = stripInternalIdentifiers(input);
  assert.equal(output, "BMW iX1 – 1 133 000 Kč");
  assert.equal(containsInternalIdentifier(output), false);
});

test("stripInternalIdentifiers removes internal source tags", () => {
  const output = stripInternalIdentifiers(
    "Cena je 500 000 Kč [zdroj 425a4793-43e3-4cde-8170-b9e73f7e89c2]",
  );
  assert.equal(output, "Cena je 500 000 Kč");
});

test("deduplicateVerifiedSources removes duplicate URLs and titles", () => {
  const deduped = deduplicateVerifiedSources([
    {
      id: "1",
      title: "Hyundai IONIQ 2",
      url: "https://example.com/ioniq",
      checkedAt: "2026-07-24",
    },
    {
      id: "2",
      title: "Hyundai IONIQ 2",
      url: "https://example.com/ioniq",
      checkedAt: "2026-07-24",
    },
    {
      id: "3",
      title: "Kia EV3",
      url: "https://example.com/ev3",
      checkedAt: "2026-07-24",
    },
  ]);

  assert.equal(deduped.length, 2);
});

test("buildGroundedChatContext does not expose UUIDs in prompt content", () => {
  const result: RetrievalResult = {
    facts: [
      {
        field: "model-level starting price",
        value: 599_990,
        unit: "CZK",
        modelId: "model-inster",
        scope: "model",
        sourceId: "src-1",
        confidence: "verified",
        priceScope: "model_starting",
        sourceTitle: "Hyundai INSTER",
        sourceUrl: "https://www.bezemisi.cz/elektromobily/hyundai/inster",
        observedAt: "2026-07-24",
      },
    ],
    commercialConditions: [],
    sources: [
      {
        id: "src-1",
        title: "Hyundai INSTER",
        url: "https://www.bezemisi.cz/elektromobily/hyundai/inster",
        checkedAt: "2026-07-24",
      },
    ],
    hasVerifiedContext: true,
    priceSummary:
      "U vozů z předchozího výběru mám tyto ověřené ceny:\n- Hyundai INSTER — cena od 599 990 Kč.",
  };

  const grounded = buildGroundedChatContext(result);
  assert.match(grounded.content, /cena od/i);
  assert.doesNotMatch(
    grounded.content,
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i,
  );
  assert.doesNotMatch(grounded.content, /\[zdroj/i);
  assert.match(grounded.sourceReferencesText, /Zdroj 1: Hyundai INSTER/);
});

test("buildGroundedChatContext keeps structured metadata in facts while hiding IDs in prose", () => {
  const result: RetrievalResult = {
    facts: [
      {
        field: "current exact stock offer",
        value: 424_999,
        unit: "CZK",
        modelId: "model-kona",
        scope: "offer",
        sourceId: "src-offer",
        confidence: "verified",
        priceScope: "stock_offer",
        sourceTitle: "Hyundai KONA Electric",
        sourceUrl: "https://example.com/kona",
        observedAt: "2026-07-24",
        offerCondition: "used",
      },
    ],
    commercialConditions: [],
    sources: [],
    hasVerifiedContext: true,
  };

  const grounded = buildGroundedChatContext(result);
  assert.match(grounded.content, /ojetá nabídka|stock_offer|stav vozu: used/i);
  assert.equal(result.facts[0]?.sourceId, "src-offer");
});
