import "server-only";

import { normalizeVehicleTitle } from "./source-title";
import type { CatalogueModelSummary } from "./repositories/catalogue-repository";
import type { CatalogueOffer, CatalogueVariantSummary, VerifiedSpecification } from "./types";

export type PriceScope =
  | "stock_offer"
  | "action_price"
  | "variant_offer"
  | "model_starting"
  | "list_price"
  | "unavailable";

/** Ignore scraped offer rows that are clearly not full vehicle prices (e.g. lease monthly). */
export const MIN_PLAUSIBLE_VEHICLE_PRICE_CZK = 50_000;

const LEASING_OFFER_TYPES = new Set([
  "operating_lease",
  "leasing",
  "lease",
  "monthly_payment",
]);

const EXCLUDED_AVAILABILITY = new Set(["sold"]);

export type ExcludedPriceCandidate = {
  price: number | null;
  scope: string;
  reason: string;
};

export type ResolvedPrice = {
  scope: PriceScope;
  value: number | null;
  currency: string;
  label: string;
  observedAt: string;
  sourceId: string;
  sourceUrl: string | null;
  sourceTitle: string;
  modelId: string;
  modelName: string;
  brandName: string;
  variantId?: string | null;
  variantName?: string | null;
  offerTitle?: string | null;
  offerCondition?: string | null;
  offerType?: string | null;
  mileageKm?: number | null;
  availabilityStatus?: string | null;
  selectionReason: string;
  excludedCandidates: ExcludedPriceCandidate[];
};

export type PriceLookupDiagnostic = {
  model: string;
  brandName: string;
  modelId: string;
  rangeKm: number | null;
  priceFound: boolean;
  chosenPrice: number | null;
  priceScope: PriceScope | "none";
  sourceUrl: string | null;
  excludedPriceRows: ExcludedPriceCandidate[];
  exclusionReason: string | null;
};

function isPlausibleVehicleOfferPrice(price: number | null) {
  return typeof price === "number" && price >= MIN_PLAUSIBLE_VEHICLE_PRICE_CZK;
}

function isLeasingOffer(offer: CatalogueOffer) {
  return LEASING_OFFER_TYPES.has(offer.offerType.toLowerCase());
}

function isExcludedOffer(offer: CatalogueOffer) {
  if (!offer.isCurrent) {
    return "stale or historical offer";
  }
  if (EXCLUDED_AVAILABILITY.has(offer.availabilityStatus)) {
    return `availability status ${offer.availabilityStatus}`;
  }
  if (isLeasingOffer(offer)) {
    return "leasing payment, not purchase price";
  }
  if (!isPlausibleVehicleOfferPrice(offer.currentPrice)) {
    return "implausible purchase price";
  }
  return null;
}

function classifyOfferScope(offer: CatalogueOffer): PriceScope {
  const offerType = offer.offerType.toLowerCase();
  if (offerType === "action_price") {
    return "action_price";
  }
  if (offerType === "stock_inventory" || offerType === "stock_offer") {
    return "stock_offer";
  }
  if (offerType === "list_price") {
    return offer.condition === "new" ? "list_price" : "stock_offer";
  }
  if (offer.condition === "used" || offer.condition === "demonstration") {
    return "stock_offer";
  }
  return "stock_offer";
}

function offerPriority(scope: PriceScope) {
  switch (scope) {
    case "stock_offer":
      return 1;
    case "action_price":
      return 2;
    case "variant_offer":
      return 3;
    case "list_price":
      return 4;
    case "model_starting":
      return 5;
    case "unavailable":
      return 6;
    default:
      return 99;
  }
}

function getModelSpec(
  specifications: VerifiedSpecification[],
  fieldKey: string,
) {
  return specifications.find((spec) => spec.fieldKey === fieldKey) ?? null;
}

function formatObservedDate(observedAt: string) {
  const parsed = new Date(observedAt);
  if (Number.isNaN(parsed.getTime())) {
    return observedAt;
  }
  return new Intl.DateTimeFormat("cs-CZ", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
  }).format(parsed);
}

function formatPriceValue(value: number, currency: string) {
  const formatted = new Intl.NumberFormat("cs-CZ").format(value);
  return currency === "CZK" ? `${formatted} Kč` : `${formatted} ${currency}`;
}

export function formatResolvedPriceForUser(price: ResolvedPrice) {
  const vehicleLabel = normalizeVehicleTitle(price.brandName, price.modelName);

  if (price.scope === "unavailable" || price.value === null) {
    return `${vehicleLabel} — ověřenou aktuální cenu zatím nemám.`;
  }

  const formattedValue = formatPriceValue(price.value, price.currency);
  const observed = formatObservedDate(price.observedAt);

  switch (price.scope) {
    case "stock_offer":
      if (price.offerCondition === "used") {
        const mileage =
          typeof price.mileageKm === "number"
            ? `, nájezd ${new Intl.NumberFormat("cs-CZ").format(price.mileageKm)} km`
            : "";
        return `${vehicleLabel} — konkrétní ojetá nabídka za ${formattedValue}${mileage}, pozorováno dne ${observed}.`;
      }
      if (price.offerCondition === "demonstration") {
        return `${vehicleLabel} — konkrétní předváděcí vůz za ${formattedValue}, pozorováno dne ${observed}.`;
      }
      return `${vehicleLabel} — konkrétní skladová nabídka za ${formattedValue}, pozorováno dne ${observed}.`;
    case "action_price":
      return `${vehicleLabel} — akční cena konkrétního vozu je ${formattedValue}, pozorováno dne ${observed}.`;
    case "variant_offer":
      return `${vehicleLabel}${price.variantName ? ` (${price.variantName})` : ""} — cena varianty ${formattedValue}, pozorováno dne ${observed}.`;
    case "list_price":
      return `${vehicleLabel} — ceníková cena ${formattedValue}, pozorováno dne ${observed}.`;
    case "model_starting":
    default:
      return `${vehicleLabel} — cena od ${formattedValue}.`;
  }
}

export function formatResolvedPriceForGrounding(price: ResolvedPrice) {
  const vehicleLabel = normalizeVehicleTitle(price.brandName, price.modelName);
  const userLine = formatResolvedPriceForUser(price);
  const scopeLabel =
    price.scope === "stock_offer"
      ? "current exact stock offer"
      : price.scope === "action_price"
        ? "current action price"
        : price.scope === "variant_offer"
          ? "exact variant price"
          : price.scope === "model_starting"
            ? "model-level starting price"
            : price.scope === "list_price"
              ? "list price"
              : "price unavailable";

  const detailParts = [
    `scope=${scopeLabel}`,
    price.offerCondition ? `condition=${price.offerCondition}` : null,
    price.offerType ? `offer_type=${price.offerType}` : null,
    typeof price.mileageKm === "number" ? `mileage_km=${price.mileageKm}` : null,
    price.availabilityStatus
      ? `availability=${price.availabilityStatus}`
      : null,
    `observed=${price.observedAt}`,
    price.sourceUrl ? `source_url=${price.sourceUrl}` : null,
    `selection_reason=${price.selectionReason}`,
  ].filter(Boolean);

  return `- ${vehicleLabel}: ${userLine} (${detailParts.join("; ")})`;
}

type RankedOffer = {
  offer: CatalogueOffer;
  variant?: CatalogueVariantSummary;
  scope: PriceScope;
};

function rankOffers(
  offers: Array<{ offer: CatalogueOffer; variant?: CatalogueVariantSummary }>,
) {
  const excluded: ExcludedPriceCandidate[] = [];
  const ranked: RankedOffer[] = [];

  for (const entry of offers) {
    const exclusion = isExcludedOffer(entry.offer);
    if (exclusion) {
      excluded.push({
        price: entry.offer.currentPrice,
        scope: entry.offer.offerType,
        reason: exclusion,
      });
      continue;
    }

    ranked.push({
      ...entry,
      scope: classifyOfferScope(entry.offer),
    });
  }

  ranked.sort((left, right) => {
    const scopeDiff = offerPriority(left.scope) - offerPriority(right.scope);
    if (scopeDiff !== 0) return scopeDiff;

    const conditionDiff =
      conditionPriority(left.offer.condition) - conditionPriority(right.offer.condition);
    if (conditionDiff !== 0) return conditionDiff;

    return Number(left.offer.currentPrice) - Number(right.offer.currentPrice);
  });

  return { ranked, excluded };
}

function conditionPriority(condition: string) {
  if (condition === "new") return 1;
  if (condition === "demonstration") return 2;
  if (condition === "used") return 3;
  return 4;
}

function resolveFromOffers(
  model: CatalogueModelSummary,
  offers: Array<{ offer: CatalogueOffer; variant?: CatalogueVariantSummary }>,
  excluded: ExcludedPriceCandidate[],
): ResolvedPrice | null {
  const { ranked, excluded: moreExcluded } = rankOffers(offers);
  const allExcluded = [...excluded, ...moreExcluded];

  if (ranked.length === 0) {
    return null;
  }

  const best = ranked[0]!;
  const source = best.offer.source;
  const sourceTitle = normalizeVehicleTitle(
    model.brandName,
    model.name,
    source.title,
  );

  return {
    scope: best.scope,
    value: best.offer.currentPrice,
    currency: best.offer.currency,
    label:
      best.scope === "action_price"
        ? "current action price"
        : best.scope === "stock_offer"
          ? "current exact stock offer"
          : best.scope === "variant_offer"
            ? "exact variant price"
            : "list price",
    observedAt: best.offer.observedAt,
    sourceId: source.id,
    sourceUrl: best.offer.offerUrl ?? source.url,
    sourceTitle,
    modelId: model.id,
    modelName: model.name,
    brandName: model.brandName,
    variantId: best.variant?.id ?? null,
    variantName: best.variant?.name ?? null,
    offerTitle: best.offer.title,
    offerCondition: best.offer.condition,
    offerType: best.offer.offerType,
    mileageKm: best.offer.mileageKm,
    availabilityStatus: best.offer.availabilityStatus,
    selectionReason: `Selected lowest-priority ${best.scope} offer over ${ranked.length - 1} other plausible offer(s)`,
    excludedCandidates: allExcluded,
  };
}

export function resolveBestPriceForModel(
  model: CatalogueModelSummary,
  variants: CatalogueVariantSummary[] = [],
): ResolvedPrice | null {
  const excluded: ExcludedPriceCandidate[] = [];

  const modelLevelOffers = model.currentOffers.map((offer) => ({ offer }));
  const fromModelOffers = resolveFromOffers(model, modelLevelOffers, excluded);
  if (fromModelOffers) {
    return fromModelOffers;
  }

  const variantLevelOffers = variants.flatMap((variant) =>
    variant.currentOffers.map((offer) => ({ offer, variant })),
  );
  const fromVariantOffers = resolveFromOffers(model, variantLevelOffers, excluded);
  if (fromVariantOffers) {
    return {
      ...fromVariantOffers,
      scope: "variant_offer",
      label: "exact variant price",
      selectionReason: `Selected lowest variant offer after no model-level offer passed filters`,
    };
  }

  const publishedPrice = getModelSpec(
    model.specifications,
    "published_starting_price_czk",
  );
  if (publishedPrice && typeof publishedPrice.value === "number") {
    const source = publishedPrice.source;
    return {
      scope: "model_starting",
      value: publishedPrice.value,
      currency: publishedPrice.unit ?? "CZK",
      label: "model-level starting price",
      observedAt: publishedPrice.source.checkedAt,
      sourceId: source.id,
      sourceUrl: source.url,
      sourceTitle: normalizeVehicleTitle(model.brandName, model.name, source.title),
      modelId: model.id,
      modelName: model.name,
      brandName: model.brandName,
      selectionReason:
        "No current exact offer passed filters; using verified model-level starting price",
      excludedCandidates: excluded,
    };
  }

  const priceUnavailable = getModelSpec(
    model.specifications,
    "published_price_unavailable",
  );
  if (priceUnavailable?.value === true) {
    const source = priceUnavailable.source;
    return {
      scope: "unavailable",
      value: null,
      currency: "CZK",
      label: "price unavailable",
      observedAt: priceUnavailable.source.checkedAt,
      sourceId: source.id,
      sourceUrl: source.url,
      sourceTitle: normalizeVehicleTitle(model.brandName, model.name, source.title),
      modelId: model.id,
      modelName: model.name,
      brandName: model.brandName,
      selectionReason:
        "Verified catalogue marks price as unavailable and no offer passed filters",
      excludedCandidates: excluded,
    };
  }

  if (excluded.length > 0) {
    return {
      scope: "unavailable",
      value: null,
      currency: "CZK",
      label: "price unavailable",
      observedAt: new Date().toISOString(),
      sourceId: model.specifications[0]?.source.id ?? "unavailable",
      sourceUrl: model.specifications[0]?.source.url ?? null,
      sourceTitle: normalizeVehicleTitle(model.brandName, model.name),
      modelId: model.id,
      modelName: model.name,
      brandName: model.brandName,
      selectionReason: "All candidate offer rows were excluded by price filters",
      excludedCandidates: excluded,
    };
  }

  return null;
}

export function resolvedPriceToFact(price: ResolvedPrice) {
  return {
    field: price.label,
    value:
      price.scope === "unavailable"
        ? "price not yet available"
        : (price.value ?? null),
    unit: price.currency,
    vehicleId: price.variantId ?? undefined,
    modelId: price.modelId,
    scope:
      price.scope === "unavailable"
        ? ("model" as const)
        : price.scope === "model_starting" || price.scope === "list_price"
          ? ("model" as const)
          : price.scope === "variant_offer"
            ? ("variant" as const)
            : ("offer" as const),
    sourceId: price.sourceId,
    confidence: "verified" as const,
    priceScope: price.scope,
    sourceUrl: price.sourceUrl,
    sourceTitle: price.sourceTitle,
    observedAt: price.observedAt,
    offerCondition: price.offerCondition,
    selectionReason: price.selectionReason,
  };
}

export function buildPriceLookupDiagnostic(
  model: CatalogueModelSummary,
  resolved: ResolvedPrice | null,
): PriceLookupDiagnostic {
  const rangeSpec = getModelSpec(
    model.specifications,
    "published_model_max_wltp_range_km",
  );

  return {
    model: model.name,
    brandName: model.brandName,
    modelId: model.id,
    rangeKm: typeof rangeSpec?.value === "number" ? rangeSpec.value : null,
    priceFound: Boolean(resolved && resolved.scope !== "unavailable"),
    chosenPrice: resolved?.value ?? null,
    priceScope: resolved?.scope ?? "none",
    sourceUrl: resolved?.sourceUrl ?? null,
    excludedPriceRows: resolved?.excludedCandidates ?? [],
    exclusionReason:
      resolved?.scope === "unavailable" ? resolved.selectionReason : null,
  };
}

export function formatPriceSummaryForModels(prices: ResolvedPrice[]) {
  return formatPriceSummaryLines(
    prices.map((price) => `- ${formatResolvedPriceForUser(price)}`),
  );
}

export function formatPriceSummaryLines(lines: string[]) {
  if (lines.length === 0) {
    return "U žádného modelu z výběru nemám ověřenou cenu.";
  }

  if (lines.length === 1) {
    return [
      lines[0]!.replace(/^-\s*/, ""),
      "",
      "U konkrétní nabídky se cena může změnit; rozhodující je vždy aktuální potvrzení Bez emisí.",
    ].join("\n");
  }

  return [
    "U vozů z předchozího výběru mám tyto ověřené ceny:",
    ...lines,
    "",
    "U konkrétních nabídek se cena může měnit; rozhodující je vždy aktuální potvrzení Bez emisí.",
  ].join("\n");
}
