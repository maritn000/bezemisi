import assert from "node:assert/strict";
import test from "node:test";

import {
  formatResolvedPriceForGrounding,
  resolveBestPriceForModel,
} from "@/lib/catalogue/price-retrieval";
import {
  understandQuery,
  understandQueryFromMessages,
} from "@/lib/catalogue/query-understanding";
import type { CatalogueModelSummary } from "@/lib/catalogue/repositories/catalogue-repository";
import { isPriceFollowUp } from "@/lib/chat/conversation-context";

function buildModelSummary(
  overrides: Partial<CatalogueModelSummary> = {},
): CatalogueModelSummary {
  return {
    id: "model-1",
    name: "Hyundai INSTER",
    slug: "inster",
    brandName: "Hyundai",
    brandSlug: "hyundai",
    category: "Městský elektromobil",
    mainImagePath: null,
    specifications: [],
    currentOffers: [],
    ...overrides,
  };
}

test("resolveBestPriceForModel prefers current offer over model starting price", () => {
  const model = buildModelSummary({
    currentOffers: [
      {
        id: "offer-1",
        title: "Aktuální nabídka",
        currentPrice: 749_990,
        currency: "CZK",
        availabilityStatus: "available",
        observedAt: "2026-07-24",
        offerUrl: null,
        isCurrent: true,
        source: {
          id: "src-offer",
          title: "Stock",
          url: "https://example.com/offer",
          publisher: "Bez emisí",
          sourceType: "bezemisi_offer_page",
          checkedAt: "2026-07-24",
        },
      },
    ],
    specifications: [
      {
        fieldKey: "published_starting_price_czk",
        value: 599_990,
        unit: "CZK",
        verificationStatus: "verified",
        source: {
          id: "src-model",
          title: "Katalog",
          url: "https://example.com/catalogue",
          publisher: "Bez emisí",
          sourceType: "bezemisi_vehicle_page",
          checkedAt: "2026-07-24",
        },
      },
    ],
  });

  const resolved = resolveBestPriceForModel(model);
  assert.equal(resolved?.scope, "offer");
  assert.equal(resolved?.value, 749_990);
});

test("resolveBestPriceForModel falls back to model-level starting price", () => {
  const model = buildModelSummary({
    specifications: [
      {
        fieldKey: "published_starting_price_czk",
        value: 599_990,
        unit: "CZK",
        verificationStatus: "verified",
        source: {
          id: "src-model",
          title: "Katalog",
          url: "https://example.com/catalogue",
          publisher: "Bez emisí",
          sourceType: "bezemisi_vehicle_page",
          checkedAt: "2026-07-24",
        },
      },
    ],
  });

  const resolved = resolveBestPriceForModel(model);
  assert.equal(resolved?.scope, "model");
  assert.equal(resolved?.value, 599_990);
  assert.match(
    formatResolvedPriceForGrounding(resolved!),
    /model-level starting price/i,
  );
});

test("resolveBestPriceForModel returns explicit unavailable status", () => {
  const model = buildModelSummary({
    specifications: [
      {
        fieldKey: "published_price_unavailable",
        value: true,
        unit: null,
        verificationStatus: "verified",
        source: {
          id: "src-unavailable",
          title: "Katalog",
          url: "https://example.com/peaq",
          publisher: "Bez emisí",
          sourceType: "bezemisi_vehicle_page",
          checkedAt: "2026-07-24",
        },
      },
    ],
  });

  const resolved = resolveBestPriceForModel(model);
  assert.equal(resolved?.scope, "unavailable");
  assert.equal(resolved?.value, null);
});

test("resolveBestPriceForModel ignores implausible scraped offer prices", () => {
  const model = buildModelSummary({
    name: "Kia EV3",
    slug: "ev3",
    brandName: "Kia",
    brandSlug: "kia",
    currentOffers: [
      {
        id: "offer-bad",
        title: "Trim price",
        currentPrice: 3,
        currency: "CZK",
        availabilityStatus: "available",
        observedAt: "2026-07-24",
        offerUrl: null,
        isCurrent: true,
        source: {
          id: "src-bad",
          title: "Bad scrape",
          url: "https://example.com/bad",
          publisher: "Bez emisí",
          sourceType: "bezemisi_vehicle_page",
          checkedAt: "2026-07-24",
        },
      },
    ],
    specifications: [
      {
        fieldKey: "published_starting_price_czk",
        value: 899_980,
        unit: "CZK",
        verificationStatus: "verified",
        source: {
          id: "src-model",
          title: "Katalog",
          url: "https://example.com/catalogue",
          publisher: "Bez emisí",
          sourceType: "bezemisi_vehicle_page",
          checkedAt: "2026-07-24",
        },
      },
    ],
  });

  const resolved = resolveBestPriceForModel(model);
  assert.equal(resolved?.scope, "model");
  assert.equal(resolved?.value, 899_980);
});

test("Czech maximum-price search is classified as vehicle_search", () => {
  const intent = understandQuery("Která auta stojí méně než 900 000 Kč?");
  assert.equal(intent.intent, "vehicle_search");
  assert.equal(intent.maximumPrice, 900_000);
});

test("price follow-up after range search resolves to offer_search with prior context", () => {
  assert.equal(isPriceFollowUp("kolik stojí?"), true);

  const intent = understandQueryFromMessages([
    {
      role: "user",
      parts: [{ text: "Která auta mají dojezd alespoň 450 km?" }],
    },
    {
      role: "assistant",
      parts: [{ text: "Nalezeny modely s dojezdem nad 450 km." }],
    },
    {
      role: "user",
      parts: [{ text: "kolik stojí?" }],
    },
  ]);

  assert.equal(intent.intent, "offer_search");
  assert.equal(intent.priorSearch?.minimumWltpRange, 450);
});

test("direct model price question keeps offer_search intent", () => {
  const intent = understandQuery("Kolik stojí Kia EV3?");
  assert.equal(intent.intent, "offer_search");
  assert.equal(intent.brand, "kia");
  assert.equal(intent.model, "ev3");
});
