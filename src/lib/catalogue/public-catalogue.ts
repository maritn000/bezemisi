import "server-only";

import {
  findModelBySlugs,
  listPresentedModels,
} from "./repositories/catalogue-repository";
import { findVariantsByIdentifier } from "./repositories/catalogue-repository";

export type PublicVehicleCard = {
  name: string;
  category: string;
  brand: string;
  model: string;
  href: string;
  rangeKm: number | null;
  priceFrom: number | null;
  priceCurrency: string | null;
  observedAt: string | null;
};

export type PublicVehicleDetail = {
  name: string;
  category: string;
  brand: string;
  model: string;
  specifications: Array<{
    label: string;
    value: string;
    observedAt: string;
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
};

const FIELD_LABELS: Record<string, string> = {
  wltp_range_km: "WLTP dojezd",
  battery_capacity_usable_kwh: "Baterie",
  max_dc_charging_kw: "Max. DC nabíjení",
  boot_capacity_l: "Objem kufru",
  power_kw: "Výkon",
};

function formatSpecValue(fieldKey: string, value: string | number | boolean, unit: string | null) {
  if (fieldKey === "vehicle_to_load") {
    return value ? "Ano" : "Ne";
  }
  return `${value}${unit ? ` ${unit}` : ""}`;
}

export async function getPublicVehicleCards(): Promise<PublicVehicleCard[]> {
  const models = await listPresentedModels();

  const cards: PublicVehicleCard[] = [];
  for (const { model, brand } of models) {
    const variants = await findVariantsByIdentifier(`${brand.slug}/${model.slug}`);
    const rangeValues = variants
      .flatMap((variant) => variant.specifications)
      .filter((spec) => spec.fieldKey === "wltp_range_km")
      .map((spec) => Number(spec.value));
    const prices = variants
      .flatMap((variant) => variant.currentOffers)
      .map((offer) => offer.currentPrice)
      .filter((price): price is number => price !== null);

    cards.push({
      name: model.name,
      category: model.vehicleCategory ?? "Elektromobil",
      brand: brand.slug,
      model: model.slug,
      href: `/elektromobily/${brand.slug}/${model.slug}`,
      rangeKm: rangeValues.length > 0 ? Math.max(...rangeValues) : null,
      priceFrom: prices.length > 0 ? Math.min(...prices) : null,
      priceCurrency: prices.length > 0 ? "CZK" : null,
      observedAt:
        variants
          .flatMap((variant) => variant.currentOffers)
          .map((offer) => offer.observedAt)
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
  const primaryVariant = variants[0];

  const specifications = primaryVariant
    ? primaryVariant.specifications
        .filter((spec) => FIELD_LABELS[spec.fieldKey])
        .map((spec) => ({
          label: FIELD_LABELS[spec.fieldKey] ?? spec.fieldKey,
          value: formatSpecValue(spec.fieldKey, spec.value, spec.unit),
          observedAt: spec.source.checkedAt,
        }))
    : [];

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
    specifications,
    offers,
    variants: variants.map((variant) => ({
      name: variant.name,
      batteryVariant: variant.batteryVariant,
      drivetrain: variant.drivetrain,
    })),
  };
}
