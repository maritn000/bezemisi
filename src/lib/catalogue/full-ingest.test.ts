import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

import { parseCataloguePage } from "@/lib/catalogue/ingestion/crawl/catalogue-parser";
import { parseModelDetailPage } from "@/lib/catalogue/ingestion/crawl/model-page-parser";
import {
  parseAzKm,
  parseCzechPrice,
  parseOperatingCostRange,
  parsePriceFromText,
} from "@/lib/catalogue/ingestion/parsers/czech";

describe("Czech catalogue parsers", () => {
  it("parses až range and Czech prices", () => {
    assert.equal(parseAzKm("Dojezd až 605 km"), 605);
    assert.equal(parsePriceFromText("Cena od 799 990 Kč"), 799_990);
    assert.equal(parseCzechPrice("Cena ještě není dostupná"), null);
    assert.deepEqual(parseOperatingCostRange("Spotřeba 78–189 Kč na 100 km"), {
      min: 78,
      max: 189,
    });
  });

  it("discovers all live catalogue cards from fixture HTML", () => {
    const html = readFileSync(
      path.join(process.cwd(), ".catalogue-cache/fixtures/catalogue.html"),
      "utf8",
    );
    const cards = parseCataloguePage(html);
    assert.ok(cards.length >= 23);
    const ix1 = cards.find((card) => card.modelSlug === "ix1");
    assert.ok(ix1);
    assert.equal(ix1?.maxWltpRangeKm, 474);
    assert.equal(ix1?.startingPriceCzk, 1_068_600);
  });

  it("parses model-level and variant facts from detail fixture", () => {
    const html = readFileSync(
      path.join(process.cwd(), ".catalogue-cache/fixtures/inster.html"),
      "utf8",
    );
    const parsed = parseModelDetailPage(
      html,
      "https://www.bezemisi.cz/elektromobily/hyundai/inster",
    );
    assert.ok(parsed.modelFacts.some((fact) => fact.fieldKey === "boot_capacity_l"));
    assert.ok(parsed.variants.length >= 1);
    assert.ok(parsed.heroImageUrl?.includes("bezemisi.cz"));
  });
});

describe("Model-level fact keys", () => {
  it("keeps published maximum range separate from variant WLTP", () => {
    const html =
      "<h3>Test</h3><p>Dojezd až <strong>510 km</strong></p><p>Verze 42 kWh: až 327 km</p>";
    const parsed = parseModelDetailPage(html, "https://example.com");
    const modelMax = parsed.modelFacts.find(
      (fact) => fact.fieldKey === "published_model_max_wltp_range_km",
    );
    const variantRange = parsed.modelFacts.find(
      (fact) => fact.fieldKey === "wltp_range_km",
    );
    assert.equal(modelMax?.value, 510);
    assert.equal(variantRange?.value, 327);
  });
});
