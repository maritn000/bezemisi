import { z } from "zod";

import { SPEC_FIELD_KEYS } from "./constants";

export const searchVehiclesInputSchema = z.object({
  brand: z.string().trim().min(1).max(64).optional(),
  model: z.string().trim().min(1).max(128).optional(),
  minimumWltpRange: z.number().positive().max(2000).optional(),
  minimumRealRange: z.number().positive().max(2000).optional(),
  minimumBootCapacity: z.number().positive().max(5000).optional(),
  minimumSeats: z.number().int().min(2).max(9).optional(),
  maximumPrice: z.number().positive().max(50_000_000).optional(),
  drivetrain: z.string().trim().min(1).max(32).optional(),
  bodyType: z.string().trim().min(1).max(64).optional(),
  availability: z
    .enum(["available", "reserved", "sold", "on_order", "unknown"])
    .optional(),
  requiredFeature: z.enum(SPEC_FIELD_KEYS).optional(),
  limit: z.number().int().min(1).max(20).default(10),
});

export const getVehicleDetailsInputSchema = z.object({
  brand: z.string().trim().min(1).max(64).optional(),
  model: z.string().trim().min(1).max(128).optional(),
  variantId: z.string().uuid().optional(),
  variantSlug: z.string().trim().min(1).max(128).optional(),
});

export const compareVehiclesInputSchema = z.object({
  identifiers: z.array(z.string().trim().min(1).max(128)).min(2).max(4),
  comparisonFields: z.array(z.enum(SPEC_FIELD_KEYS)).max(20).optional(),
});

export const getCurrentOffersInputSchema = z.object({
  brand: z.string().trim().min(1).max(64).optional(),
  model: z.string().trim().min(1).max(128).optional(),
  variantId: z.string().uuid().optional(),
  priceLimit: z.number().positive().max(50_000_000).optional(),
  availabilityStatus: z
    .enum(["available", "reserved", "sold", "on_order", "unknown"])
    .optional(),
  limit: z.number().int().min(1).max(20).default(10),
});

export const getCommercialConditionsInputSchema = z.object({
  conditionTypes: z
    .array(
      z.enum([
        "purchase_process",
        "financing",
        "operating_lease",
        "trade_in",
        "warranty",
        "delivery",
        "reservation",
        "deposit",
        "payment",
        "returns",
        "contact",
        "other",
      ]),
    )
    .min(1)
    .max(12),
});

export const queryIntentSchema = z.object({
  intent: z.enum([
    "vehicle_search",
    "vehicle_detail",
    "vehicle_comparison",
    "offer_search",
    "commercial_question",
    "clarification_needed",
    "out_of_scope",
  ]),
  brand: z.string().optional(),
  model: z.string().optional(),
  models: z.array(z.string()).max(4).optional(),
  minimumWltpRange: z.number().optional(),
  minimumRealRange: z.number().optional(),
  minimumBootCapacity: z.number().optional(),
  minimumSeats: z.number().int().optional(),
  maximumPrice: z.number().optional(),
  drivetrain: z.string().optional(),
  availability: z
    .enum(["available", "reserved", "sold", "on_order", "unknown"])
    .optional(),
  requiredFeature: z.enum(SPEC_FIELD_KEYS).optional(),
  sortByField: z.enum(SPEC_FIELD_KEYS).optional(),
  conditionTypes: z.array(z.string()).optional(),
  needsClarification: z.boolean().optional(),
  clarificationReason: z.string().optional(),
  priorSearch: z
    .object({
      intent: z.literal("vehicle_search"),
      brand: z.string().optional(),
      model: z.string().optional(),
      minimumWltpRange: z.number().optional(),
      minimumRealRange: z.number().optional(),
      minimumBootCapacity: z.number().optional(),
      minimumSeats: z.number().int().optional(),
      maximumPrice: z.number().optional(),
      drivetrain: z.string().optional(),
      availability: z
        .enum(["available", "reserved", "sold", "on_order", "unknown"])
        .optional(),
      requiredFeature: z.enum(SPEC_FIELD_KEYS).optional(),
      sortByField: z.enum(SPEC_FIELD_KEYS).optional(),
    })
    .optional(),
  targetModels: z
    .array(
      z.object({
        brand: z.string(),
        model: z.string(),
      }),
    )
    .optional(),
  modelIds: z.array(z.string().uuid()).optional(),
  variantIds: z.array(z.string().uuid()).optional(),
});

export type SearchVehiclesInput = z.infer<typeof searchVehiclesInputSchema>;
export type GetVehicleDetailsInput = z.infer<typeof getVehicleDetailsInputSchema>;
export type CompareVehiclesInput = z.infer<typeof compareVehiclesInputSchema>;
export type GetCurrentOffersInput = z.infer<typeof getCurrentOffersInputSchema>;
export type GetCommercialConditionsInput = z.infer<
  typeof getCommercialConditionsInputSchema
>;
export type QueryIntent = z.infer<typeof queryIntentSchema>;

export type SourceReference = {
  id: string;
  title: string;
  url: string | null;
  publisher: string | null;
  sourceType: string;
  checkedAt: string;
  variantId?: string;
  modelId?: string;
};

export type VerifiedSpecification = {
  fieldKey: string;
  value: string | number | boolean;
  unit: string | null;
  verificationStatus: string;
  source: SourceReference;
};

export type CatalogueOffer = {
  id: string;
  title: string;
  currentPrice: number | null;
  listPrice: number | null;
  currency: string;
  availabilityStatus: string;
  offerType: string;
  condition: string;
  mileageKm: number | null;
  observedAt: string;
  offerUrl: string | null;
  source: SourceReference;
  isCurrent: boolean;
};

export type CatalogueVariantSummary = {
  id: string;
  name: string;
  slug: string;
  brandName: string;
  modelName: string;
  modelSlug: string;
  brandSlug: string;
  trimName: string | null;
  batteryVariant: string | null;
  drivetrain: string | null;
  specifications: VerifiedSpecification[];
  currentOffers: CatalogueOffer[];
  missingFields: string[];
  conflictingFields: string[];
};

export type VehicleSearchResult = {
  variants: CatalogueVariantSummary[];
  totalMatched: number;
};

export type VehicleComparisonResult = {
  variants: CatalogueVariantSummary[];
  comparisonFields: string[];
  ambiguous: boolean;
  ambiguityMessage?: string;
};

export type CommercialConditionResult = {
  id: string;
  conditionType: string;
  title: string;
  content: string;
  observedAt: string;
  source: SourceReference;
};
