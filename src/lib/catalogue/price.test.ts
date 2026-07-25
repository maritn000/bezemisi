import assert from "node:assert/strict";
import test from "node:test";

import {
  formatResolvedPriceForGrounding,
  formatResolvedPriceForUser,
  resolveBestPriceForModel,
} from "@/lib/catalogue/price-retrieval";
import {
  understandQuery,
  understandQueryFromMessages,
} from "@/lib/catalogue/query-understanding";
import type { CatalogueModelSummary } from "@/lib/catalogue/repositories/catalogue-repository";
import type { CatalogueOffer } from "@/lib/catalogue/types";
import { isPriceFollowUp } from "@/lib/chat/conversation-context";

function buildOffer(overrides: Partial<CatalogueOffer> = {}): CatalogueOffer {
  return {
    id: "offer-1",
    title: "Aktuální nabídka",
    currentPrice: 749_990,
    listPrice: null,
    currency: "CZK",
    availabilityStatus: "available",
    offerType: "stock_inventory",
    condition: "new",
    mileageKm: null,
    observedAt: "2026-07-24",
    offerUrl: "https://example.com/offer",
    isCurrent: true,
    source: {
      id: "src-offer",
      title: "Stock",
      url: "https://example.com/offer",
      publisher: "Bez emisí",
      sourceType: "bezemisi_offer_page",
      checkedAt: "2026-07-24",
    },
    ...overrides,
  };
}

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
    currentOffers: [buildOffer()],
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
  assert.equal(resolved?.scope, "stock_offer");
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
  assert.equal(resolved?.scope, "model_starting");
  assert.equal(resolved?.value, 599_990);
  assert.match(
    formatResolvedPriceForGrounding(resolved!),
    /cena od/i,
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
      buildOffer({
        id: "offer-bad",
        title: "Trim price",
        currentPrice: 3,
        offerType: "trim_price",
        source: {
          id: "src-bad",
          title: "Bad scrape",
          url: "https://example.com/bad",
          publisher: "Bez emisí",
          sourceType: "bezemisi_vehicle_page",
          checkedAt: "2026-07-24",
        },
      }),
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
  assert.equal(resolved?.scope, "model_starting");
  assert.equal(resolved?.value, 899_980);
});

test("resolveBestPriceForModel labels used stock offer separately from model starting price", () => {
  const model = buildModelSummary({
    name: "KONA Electric",
    slug: "kona-electric",
    currentOffers: [
      buildOffer({
        currentPrice: 424_999,
        condition: "used",
        mileageKm: 12_500,
        offerType: "stock_inventory",
      }),
    ],
    specifications: [
      {
        fieldKey: "published_starting_price_czk",
        value: 799_990,
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
  assert.equal(resolved?.scope, "stock_offer");
  assert.equal(resolved?.value, 424_999);
  assert.match(formatResolvedPriceForUser(resolved!), /ojetá nabídka/i);
  assert.doesNotMatch(formatResolvedPriceForUser(resolved!), /cena od/i);
});

test("resolveBestPriceForModel excludes leasing payments", () => {
  const model = buildModelSummary({
    currentOffers: [
      buildOffer({
        currentPrice: 9_990,
        offerType: "operating_lease",
      }),
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
  assert.equal(resolved?.scope, "model_starting");
});

test("resolveBestPriceForModel excludes sold offers", () => {
  const model = buildModelSummary({
    currentOffers: [
      buildOffer({
        availabilityStatus: "sold",
      }),
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
  assert.equal(resolved?.scope, "model_starting");
});

test("formatResolvedPriceForUser contains no UUID", () => {
  const model = buildModelSummary({
    id: "2bb67414-5aef-4c84-b1c0-6f92c051c040",
    currentOffers: [
      buildOffer({
        source: {
          id: "425a4793-43e3-4cde-8170-b9e73f7e89c2",
          title: "BMW iX1",
          url: "https://example.com/ix1",
          publisher: "Bez emisí",
          sourceType: "bezemisi_vehicle_page",
          checkedAt: "2026-07-24",
        },
      }),
    ],
  });

  const resolved = resolveBestPriceForModel(model)!;
  const formatted = formatResolvedPriceForUser(resolved);
  assert.doesNotMatch(formatted, /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
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

test("formatPriceSummaryForModels uses Czech multi-vehicle structure", async () => {
  const { formatPriceSummaryForModels } = await import(
    "@/lib/catalogue/price-retrieval"
  );
  const summary = formatPriceSummaryForModels([
    {
      scope: "model_starting",
      value: 1_133_000,
      currency: "CZK",
      label: "model-level starting price",
      observedAt: "2026-07-24",
      sourceId: "src-1",
      sourceUrl: "https://example.com/ix1",
      sourceTitle: "BMW iX1",
      modelId: "m1",
      modelName: "iX1",
      brandName: "BMW",
      selectionReason: "test",
      excludedCandidates: [],
    },
    {
      scope: "stock_offer",
      value: 424_999,
      currency: "CZK",
      label: "current exact stock offer",
      observedAt: "2026-07-24",
      sourceId: "src-2",
      sourceUrl: "https://example.com/kona",
      sourceTitle: "Hyundai KONA Electric",
      modelId: "m2",
      modelName: "KONA Electric",
      brandName: "Hyundai",
      offerCondition: "used",
      selectionReason: "test",
      excludedCandidates: [],
    },
  ]);

  assert.match(summary, /U vozů z předchozího výběru mám tyto ověřené ceny:/);
  assert.match(summary, /cena od 1[\s\u00a0\u202f]?133[\s\u00a0\u202f]?000 Kč/);
  assert.match(summary, /ojetá nabídka za 424[\s\u00a0\u202f]?999 Kč/);
  assert.match(
    summary,
    /U konkrétních nabídek se cena může měnit; rozhodující je vždy aktuální potvrzení Bez emisí\./,
  );
});
