import "server-only";

import type { CatalogueModelSummary } from "./repositories/catalogue-repository";
import type { CatalogueVariantSummary, VerifiedSpecification } from "./types";

export type PriceScope = "offer" | "variant" | "model" | "unavailable";

export type ResolvedPrice = {
  scope: PriceScope;
  value: number | null;
  currency: string;
  label: string;
  observedAt: string;
  sourceId: string;
  modelId: string;
  modelName: string;
  brandName: string;
  variantId?: string | null;
  variantName?: string | null;
  offerTitle?: string | null;
};

function getModelSpec(
  specifications: VerifiedSpecification[],
  fieldKey: string,
) {
  return specifications.find((spec) => spec.fieldKey === fieldKey) ?? null;
}

export function resolveBestPriceForModel(
  model: CatalogueModelSummary,
  variants: CatalogueVariantSummary[] = [],
): ResolvedPrice | null {
  const modelOffers = model.currentOffers
    .filter((offer) => offer.currentPrice !== null)
    .sort((left, right) => Number(left.currentPrice) - Number(right.currentPrice));

  if (modelOffers.length > 0) {
    const offer = modelOffers[0]!;
    return {
      scope: "offer",
      value: offer.currentPrice,
      currency: offer.currency,
      label: "current offer price",
      observedAt: offer.observedAt,
      sourceId: offer.source.id,
      modelId: model.id,
      modelName: model.name,
      brandName: model.brandName,
      offerTitle: offer.title,
    };
  }

  const variantOffers = variants
    .flatMap((variant) =>
      variant.currentOffers
        .filter((offer) => offer.currentPrice !== null)
        .map((offer) => ({ variant, offer })),
    )
    .sort(
      (left, right) =>
        Number(left.offer.currentPrice) - Number(right.offer.currentPrice),
    );

  if (variantOffers.length > 0) {
    const { variant, offer } = variantOffers[0]!;
    return {
      scope: "variant",
      value: offer.currentPrice,
      currency: offer.currency,
      label: "variant price",
      observedAt: offer.observedAt,
      sourceId: offer.source.id,
      modelId: model.id,
      modelName: model.name,
      brandName: model.brandName,
      variantId: variant.id,
      variantName: variant.name,
      offerTitle: offer.title,
    };
  }

  const publishedPrice = getModelSpec(
    model.specifications,
    "published_starting_price_czk",
  );
  if (publishedPrice && typeof publishedPrice.value === "number") {
    return {
      scope: "model",
      value: publishedPrice.value,
      currency: publishedPrice.unit ?? "CZK",
      label: "model-level starting price",
      observedAt: publishedPrice.source.checkedAt,
      sourceId: publishedPrice.source.id,
      modelId: model.id,
      modelName: model.name,
      brandName: model.brandName,
    };
  }

  const priceUnavailable = getModelSpec(
    model.specifications,
    "published_price_unavailable",
  );
  if (priceUnavailable?.value === true) {
    return {
      scope: "unavailable",
      value: null,
      currency: "CZK",
      label: "price unavailable",
      observedAt: priceUnavailable.source.checkedAt,
      sourceId: priceUnavailable.source.id,
      modelId: model.id,
      modelName: model.name,
      brandName: model.brandName,
    };
  }

  return null;
}

export function formatResolvedPriceForGrounding(price: ResolvedPrice) {
  const vehicleRef = price.variantId
    ? `variant ${price.variantId}`
    : `model ${price.modelId}`;
  const modelLabel = `${price.brandName} ${price.modelName}`;

  if (price.scope === "unavailable") {
    return `- ${price.label}: verified as not yet published for ${modelLabel} (${vehicleRef}), observed ${price.observedAt} [zdroj ${price.sourceId}]`;
  }

  const formattedValue = new Intl.NumberFormat("cs-CZ").format(price.value ?? 0);
  const scopeDetail =
    price.scope === "offer"
      ? `Aktuální nabídka${price.offerTitle ? ` (${price.offerTitle})` : ""}`
      : price.scope === "variant"
        ? `Cena varianty${price.variantName ? ` ${price.variantName}` : ""}`
        : "Cena od (modelová úroveň)";

  return `- ${price.label}: ${scopeDetail} ${formattedValue} ${price.currency} for ${modelLabel} (${vehicleRef}), observed ${price.observedAt} [zdroj ${price.sourceId}]`;
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
        : price.scope === "offer"
          ? ("offer" as const)
          : price.scope === "variant"
            ? ("variant" as const)
            : ("model" as const),
    sourceId: price.sourceId,
    confidence: "verified" as const,
  };
}
