import "server-only";

import {
  WLTP_RANGE_FIELD_KEY,
  WLTP_RANGE_LABEL,
} from "./constants";
import {
  findModelBySlugs,
  findVariantsByIdentifier,
  getModelSpecifications,
  getModelSummaries,
} from "./repositories/catalogue-repository";
import type { CatalogueVariantSummary } from "./types";

export type PublicVehicleCard = {
  name: string;
  category: string;
  brand: string;
  model: string;
  href: string;
  rangeKm: number | null;
  rangeLabel: string | null;
  priceFrom: number | null;
  priceLabel: string | null;
  priceCurrency: string | null;
  observedAt: string | null;
  imagePath: string | null;
  operatingCostLabel: string | null;
};

export type PublicVariantRange = {
  name: string;
  batteryVariant: string | null;
  drivetrain: string | null;
  wltpRangeKm: number | null;
  sourceTitle: string | null;
  sourceUrl: string | null;
  observedAt: string | null;
};

export type PublicVehicleDetail = {
  name: string;
  category: string;
  brand: string;
  model: string;
  imagePath: string | null;
  rangeSummary: {
    minKm: number;
    maxKm: number;
    label: string;
    isModelLevelMaximum: boolean;
  } | null;
  specifications: Array<{
    label: string;
    value: string;
    observedAt: string;
    variantName?: string;
    scope: "model" | "variant";
    isMaximum?: boolean;
  }>;
  offers: Array<{
    title: string;
    price: number | null;
    currency: string;
    observedAt: string;
    scope: "model" | "variant";
  }>;
  variants: Array<{
    name: string;
    batteryVariant: string | null;
    drivetrain: string | null;
  }>;
  variantRanges: PublicVariantRange[];
  sources: Array<{
    title: string;
    url: string | null;
    checkedAt: string;
  }>;
};

const FIELD_LABELS: Record<string, string> = {
  wltp_range_km: WLTP_RANGE_LABEL,
  published_model_max_wltp_range_km: "Dojezd až (model)",
  published_starting_price_czk: "Cena od",
  published_price_unavailable: "Cena",
  published_operating_cost_min_czk_per_100km: "Spotřeba od",
  published_operating_cost_max_czk_per_100km: "Spotřeba do",
  battery_capacity_usable_kwh: "Baterie",
  max_dc_charging_kw: "Max. DC nabíjení",
  boot_capacity_l: "Objem kufru",
  power_kw: "Výkon",
};

function formatSpecValue(fieldKey: string, value: string | number | boolean, unit: string | null) {
  if (fieldKey === "vehicle_to_load" || fieldKey === "heat_pump_standard") {
    return value ? "Ano" : "Ne";
  }
  if (fieldKey === "published_price_unavailable") {
    return value ? "Zatím není dostupná" : "Neuvedeno";
  }
  if (fieldKey === WLTP_RANGE_FIELD_KEY) {
    return `${value} km`;
  }
  if (fieldKey === "published_model_max_wltp_range_km") {
    return `až ${value} km`;
  }
  if (fieldKey === "published_starting_price_czk") {
    return `od ${new Intl.NumberFormat("cs-CZ").format(Number(value))} Kč`;
  }
  return `${value}${unit ? ` ${unit}` : ""}`;
}

function getVerifiedWltpRange(variant: CatalogueVariantSummary) {
  const spec = variant.specifications.find(
    (row) => row.fieldKey === WLTP_RANGE_FIELD_KEY && typeof row.value === "number",
  );
  if (!spec || typeof spec.value !== "number") {
    return null;
  }

  return {
    value: spec.value,
    sourceTitle: spec.source.title,
    sourceUrl: spec.source.url,
    observedAt: spec.source.checkedAt,
  };
}

function getModelSpecValue(
  specs: Awaited<ReturnType<typeof getModelSpecifications>>,
  fieldKey: string,
) {
  const spec = specs.find((row) => row.fieldKey === fieldKey);
  if (!spec) return null;
  return spec;
}

export async function getPublicVehicleCards(): Promise<PublicVehicleCard[]> {
  const modelSummaries = await getModelSummaries();

  const cards: PublicVehicleCard[] = [];
  for (const model of modelSummaries) {
    const variants = await findVariantsByIdentifier(
      `${model.brandSlug}/${model.slug}`,
    );
    const rangeValues = variants
      .map((variant) => getVerifiedWltpRange(variant)?.value)
      .filter((value): value is number => typeof value === "number");

    const publishedMax = getModelSpecValue(
      model.specifications,
      "published_model_max_wltp_range_km",
    );
    const publishedPrice = getModelSpecValue(
      model.specifications,
      "published_starting_price_czk",
    );
    const priceUnavailable = getModelSpecValue(
      model.specifications,
      "published_price_unavailable",
    );
    const operatingCostMin = getModelSpecValue(
      model.specifications,
      "published_operating_cost_min_czk_per_100km",
    );
    const operatingCostMax = getModelSpecValue(
      model.specifications,
      "published_operating_cost_max_czk_per_100km",
    );

    const variantPrices = variants
      .flatMap((variant) => variant.currentOffers)
      .map((offer) => offer.currentPrice)
      .filter((price): price is number => price !== null);
    const modelOfferPrices = model.currentOffers
      .map((offer) => offer.currentPrice)
      .filter((price): price is number => price !== null);

    const maxRange =
      rangeValues.length > 0
        ? Math.max(...rangeValues)
        : typeof publishedMax?.value === "number"
          ? publishedMax.value
          : null;

    const priceFrom =
      variantPrices.length > 0
        ? Math.min(...variantPrices)
        : modelOfferPrices.length > 0
          ? Math.min(...modelOfferPrices)
          : typeof publishedPrice?.value === "number"
            ? publishedPrice.value
            : null;

    const observedAt = [
      publishedMax?.source.checkedAt,
      publishedPrice?.source.checkedAt,
      ...variants.flatMap((variant) => [
        ...variant.currentOffers.map((offer) => offer.observedAt),
        ...variant.specifications
          .filter((spec) => spec.fieldKey === WLTP_RANGE_FIELD_KEY)
          .map((spec) => spec.source.checkedAt),
      ]),
      ...model.currentOffers.map((offer) => offer.observedAt),
    ]
      .filter(Boolean)
      .sort()
      .at(-1) ?? null;

    const operatingCostLabel =
      operatingCostMin && operatingCostMax
        ? `Spotřeba ${operatingCostMin.value}–${operatingCostMax.value} Kč na 100 km`
        : null;

    cards.push({
      name: model.name,
      category: model.category ?? "Elektromobil",
      brand: model.brandSlug,
      model: model.slug,
      href: `/elektromobily/${model.brandSlug}/${model.slug}`,
      rangeKm: maxRange,
      rangeLabel:
        maxRange !== null
          ? rangeValues.length > 0
            ? `${WLTP_RANGE_LABEL}: ${maxRange} km`
            : `Dojezd až ${maxRange} km`
          : null,
      priceFrom,
      priceLabel:
        priceFrom !== null
          ? `Cena od ${new Intl.NumberFormat("cs-CZ").format(priceFrom)} Kč`
          : priceUnavailable?.value === true
            ? "Cena zatím není dostupná"
            : null,
      priceCurrency: priceFrom !== null ? "CZK" : null,
      observedAt,
      imagePath: model.mainImagePath,
      operatingCostLabel,
    });
  }

  return cards;
}

export async function getPublicVehicleDetail(
  brandSlug: string,
  modelSlug: string,
): Promise<PublicVehicleDetail | null> {
  const modelRow = await findModelBySlugs(brandSlug, modelSlug);
  if (!modelRow) return null;

  const modelSpecs = await getModelSpecifications(modelRow.model.id);
  const variants = await findVariantsByIdentifier(`${brandSlug}/${modelSlug}`);

  const variantRanges = variants.map((variant) => {
    const range = getVerifiedWltpRange(variant);
    return {
      name: variant.name,
      batteryVariant: variant.batteryVariant,
      drivetrain: variant.drivetrain,
      wltpRangeKm: range?.value ?? null,
      sourceTitle: range?.sourceTitle ?? null,
      sourceUrl: range?.sourceUrl ?? null,
      observedAt: range?.observedAt ?? null,
    };
  });

  const variantSpecifications = variants.flatMap((variant) =>
    variant.specifications
      .filter((spec) => FIELD_LABELS[spec.fieldKey])
      .map((spec) => ({
        label: FIELD_LABELS[spec.fieldKey] ?? spec.fieldKey,
        value: formatSpecValue(spec.fieldKey, spec.value, spec.unit),
        observedAt: spec.source.checkedAt,
        variantName: variants.length > 1 ? variant.name : undefined,
        scope: "variant" as const,
      })),
  );

  const modelSpecifications = modelSpecs
    .filter((spec) => FIELD_LABELS[spec.fieldKey])
    .map((spec) => ({
      label: FIELD_LABELS[spec.fieldKey] ?? spec.fieldKey,
      value: formatSpecValue(spec.fieldKey, spec.value, spec.unit),
      observedAt: spec.source.checkedAt,
      scope: "model" as const,
      isMaximum: spec.fieldKey === "published_model_max_wltp_range_km",
    }));

  const specifications = [...modelSpecifications, ...variantSpecifications];

  const modelSummary = (await getModelSummaries()).find(
    (row) => row.brandSlug === brandSlug && row.slug === modelSlug,
  );

  const offers = [
    ...(modelSummary?.currentOffers ?? []).map((offer) => ({
      title: offer.title,
      price: offer.currentPrice,
      currency: offer.currency,
      observedAt: offer.observedAt,
      scope: "model" as const,
    })),
    ...variants.flatMap((variant) =>
      variant.currentOffers.map((offer) => ({
        title: offer.title,
        price: offer.currentPrice,
        currency: offer.currency,
        observedAt: offer.observedAt,
        scope: "variant" as const,
      })),
    ),
  ];

  const rangeValues = variantRanges
    .map((row) => row.wltpRangeKm)
    .filter((value): value is number => value !== null);
  const publishedMax = getModelSpecValue(
    modelSpecs,
    "published_model_max_wltp_range_km",
  );

  let rangeSummary: PublicVehicleDetail["rangeSummary"] = null;
  if (rangeValues.length > 0) {
    const minKm = Math.min(...rangeValues);
    const maxKm = Math.max(...rangeValues);
    rangeSummary = {
      minKm,
      maxKm,
      label:
        minKm === maxKm
          ? `${WLTP_RANGE_LABEL}: ${minKm} km`
          : `${WLTP_RANGE_LABEL}: ${minKm}–${maxKm} km`,
      isModelLevelMaximum: false,
    };
  } else if (typeof publishedMax?.value === "number") {
    rangeSummary = {
      minKm: publishedMax.value,
      maxKm: publishedMax.value,
      label: `Dojezd až ${publishedMax.value} km`,
      isModelLevelMaximum: true,
    };
  }

  const sources = [
    ...modelSpecs.map((spec) => ({
      title: spec.source.title,
      url: spec.source.url,
      checkedAt: spec.source.checkedAt,
    })),
    ...variants.flatMap((variant) =>
      variant.specifications.map((spec) => ({
        title: spec.source.title,
        url: spec.source.url,
        checkedAt: spec.source.checkedAt,
      })),
    ),
  ].filter(
    (source, index, array) =>
      array.findIndex((row) => row.url === source.url) === index,
  );

  return {
    name: modelRow.model.name,
    category: modelRow.model.vehicleCategory ?? "Elektromobil",
    brand: modelRow.brand.slug,
    model: modelRow.model.slug,
    imagePath: modelRow.model.mainImagePath,
    rangeSummary,
    specifications,
    offers,
    variants: variants.map((variant) => ({
      name: variant.name,
      batteryVariant: variant.batteryVariant,
      drivetrain: variant.drivetrain,
    })),
    variantRanges,
    sources,
  };
}
