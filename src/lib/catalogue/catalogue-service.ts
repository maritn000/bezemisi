import "server-only";

import { z } from "zod";

import {
  compareVehiclesInputSchema,
  getCommercialConditionsInputSchema,
  getCurrentOffersInputSchema,
  getVehicleDetailsInputSchema,
  searchVehiclesInputSchema,
  type CompareVehiclesInput,
  type GetCommercialConditionsInput,
  type GetCurrentOffersInput,
  type SearchVehiclesInput,
  type VehicleComparisonResult,
  type VehicleSearchResult,
} from "./types";
import {
  findModelBySlugs,
  findVariantsByIdentifier,
  getCommercialConditions,
  getCurrentOffers,
  getVariantSummariesByIds,
  searchVariants,
} from "./repositories/catalogue-repository";

export async function searchVehicles(
  input: SearchVehiclesInput,
): Promise<VehicleSearchResult> {
  const parsed = searchVehiclesInputSchema.parse(input);
  return searchVariants(parsed);
}

export async function getVehicleDetails(input: {
  brand?: string;
  model?: string;
  variantId?: string;
  variantSlug?: string;
}) {
  const parsed = getVehicleDetailsInputSchema.parse(input);

  if (parsed.variantId) {
    const variants = await getVariantSummariesByIds([parsed.variantId]);
    return { variants, ambiguous: false };
  }

  if (parsed.brand && parsed.model) {
    const model = await findModelBySlugs(parsed.brand, parsed.model);
    if (!model) return { variants: [], ambiguous: false };

    const variants = await findVariantsByIdentifier(
      `${parsed.brand}/${parsed.model}`,
    );
    return {
      variants,
      ambiguous: variants.length > 1,
      ambiguityMessage:
        variants.length > 1
          ? "Pro tento model existuje více technických variant. Upřesněte prosím baterii, pohon nebo výbavu."
          : undefined,
    };
  }

  const identifier = parsed.variantSlug ?? parsed.model ?? parsed.brand;
  if (!identifier) {
    return { variants: [], ambiguous: false };
  }

  const variants = await findVariantsByIdentifier(identifier);
  return {
    variants,
    ambiguous: variants.length > 1,
    ambiguityMessage:
      variants.length > 1
        ? "Dotaz odpovídá více variantám. Upřesněte prosím konkrétní variantu."
        : undefined,
  };
}

export async function compareVehicles(
  input: CompareVehiclesInput,
): Promise<VehicleComparisonResult> {
  const parsed = compareVehiclesInputSchema.parse(input);
  const variantMap = new Map<string, Awaited<ReturnType<typeof findVariantsByIdentifier>>[number]>();

  for (const identifier of parsed.identifiers) {
    const matches = await findVariantsByIdentifier(identifier);
    for (const variant of matches) {
      variantMap.set(variant.id, variant);
    }
  }

  const variants = [...variantMap.values()];
  const ambiguityChecks = await Promise.all(
    parsed.identifiers.map(async (identifier) => {
      const matches = await findVariantsByIdentifier(identifier);
      return matches.length > 1;
    }),
  );

  return {
    variants,
    comparisonFields:
      parsed.comparisonFields ??
      [
        "wltp_range_km",
        "battery_capacity_usable_kwh",
        "max_dc_charging_kw",
        "boot_capacity_l",
        "power_kw",
      ],
    ambiguous: ambiguityChecks.some(Boolean),
    ambiguityMessage: ambiguityChecks.some(Boolean)
      ? "Srovnání vyžaduje upřesnění konkrétních variant u modelů s více bateriemi nebo pohony."
      : undefined,
  };
}

export async function getCurrentOffersTool(input: GetCurrentOffersInput) {
  const parsed = getCurrentOffersInputSchema.parse(input);
  return getCurrentOffers(parsed);
}

export async function getCommercialConditionsTool(
  input: GetCommercialConditionsInput,
) {
  const parsed = getCommercialConditionsInputSchema.parse(input);
  return getCommercialConditions(parsed.conditionTypes);
}

export const catalogueToolSchemas = {
  searchVehicles: searchVehiclesInputSchema,
  getVehicleDetails: getVehicleDetailsInputSchema,
  compareVehicles: compareVehiclesInputSchema,
  getCurrentOffers: getCurrentOffersInputSchema,
  getCommercialConditions: getCommercialConditionsInputSchema,
} satisfies Record<string, z.ZodTypeAny>;
