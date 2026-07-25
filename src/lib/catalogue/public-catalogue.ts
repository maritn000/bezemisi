import "server-only";

import {
  WLTP_RANGE_FIELD_KEY,
  WLTP_RANGE_LABEL,
} from "./constants";
import {
  findModelBySlugs,
  listPresentedModels,
} from "./repositories/catalogue-repository";
import { findVariantsByIdentifier } from "./repositories/catalogue-repository";
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
  priceCurrency: string | null;
  observedAt: string | null;
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
  rangeSummary: {
    minKm: number;
    maxKm: number;
    label: string;
  } | null;
  specifications: Array<{
    label: string;
    value: string;
    observedAt: string;
    variantName?: string;
  }>;
  offers: Array<{
    title: string;
    price: number | null;
    currency: string;
    observedAt: string;
  }>;
  variants: Array<{
    name: string;
    batteryVariant: string | null;
    drivetrain: string | null;
  }>;
  variantRanges: PublicVariantRange[];
};

const FIELD_LABELS: Record<string, string> = {
  wltp_range_km: WLTP_RANGE_LABEL,
  battery_capacity_usable_kwh: "Baterie",
  max_dc_charging_kw: "Max. DC nabíjení",
  boot_capacity_l: "Objem kufru",
  power_kw: "Výkon",
};

function formatSpecValue(fieldKey: string, value: string | number | boolean, unit: string | null) {
  if (fieldKey === "vehicle_to_load") {
    return value ? "Ano" : "Ne";
  }
  if (fieldKey === WLTP_RANGE_FIELD_KEY) {
    return `${value} km`;
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

function buildRangeSummary(variants: CatalogueVariantSummary[]) {
  const values = variants
    .map((variant) => getVerifiedWltpRange(variant)?.value)
    .filter((value): value is number => typeof value === "number");

  if (values.length === 0) {
    return null;
  }

  const minKm = Math.min(...values);
  const maxKm = Math.max(...values);

  return {
    minKm,
    maxKm,
    label:
      minKm === maxKm
        ? `${WLTP_RANGE_LABEL}: ${minKm} km`
        : `${WLTP_RANGE_LABEL}: ${minKm}–${maxKm} km`,
  };
}

export async function getPublicVehicleCards(): Promise<PublicVehicleCard[]> {
  const models = await listPresentedModels();

  const cards: PublicVehicleCard[] = [];
  for (const { model, brand } of models) {
    const variants = await findVariantsByIdentifier(`${brand.slug}/${model.slug}`);
    const rangeValues = variants
      .map((variant) => getVerifiedWltpRange(variant)?.value)
      .filter((value): value is number => typeof value === "number");
    const prices = variants
      .flatMap((variant) => variant.currentOffers)
      .map((offer) => offer.currentPrice)
      .filter((price): price is number => price !== null);

    const maxRange = rangeValues.length > 0 ? Math.max(...rangeValues) : null;

    cards.push({
      name: model.name,
      category: model.vehicleCategory ?? "Elektromobil",
      brand: brand.slug,
      model: model.slug,
      href: `/elektromobily/${brand.slug}/${model.slug}`,
      rangeKm: maxRange,
      rangeLabel: maxRange !== null ? `${WLTP_RANGE_LABEL}: ${maxRange} km` : null,
      priceFrom: prices.length > 0 ? Math.min(...prices) : null,
      priceCurrency: prices.length > 0 ? "CZK" : null,
      observedAt:
        variants
          .flatMap((variant) => [
            ...variant.currentOffers.map((offer) => offer.observedAt),
            ...variant.specifications
              .filter((spec) => spec.fieldKey === WLTP_RANGE_FIELD_KEY)
              .map((spec) => spec.source.checkedAt),
          ])
          .sort()
          .at(-1) ?? null,
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

  const specifications = variants.flatMap((variant) =>
    variant.specifications
      .filter((spec) => FIELD_LABELS[spec.fieldKey])
      .map((spec) => ({
        label: FIELD_LABELS[spec.fieldKey] ?? spec.fieldKey,
        value: formatSpecValue(spec.fieldKey, spec.value, spec.unit),
        observedAt: spec.source.checkedAt,
        variantName: variants.length > 1 ? variant.name : undefined,
      })),
  );

  const offers = variants
    .flatMap((variant) => variant.currentOffers)
    .map((offer) => ({
      title: offer.title,
      price: offer.currentPrice,
      currency: offer.currency,
      observedAt: offer.observedAt,
    }));

  return {
    name: modelRow.model.name,
    category: modelRow.model.vehicleCategory ?? "Elektromobil",
    brand: modelRow.brand.slug,
    model: modelRow.model.slug,
    rangeSummary: buildRangeSummary(variants),
    specifications,
    offers,
    variants: variants.map((variant) => ({
      name: variant.name,
      batteryVariant: variant.batteryVariant,
      drivetrain: variant.drivetrain,
    })),
    variantRanges,
  };
}
