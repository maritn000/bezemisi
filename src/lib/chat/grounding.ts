import "server-only";

import { normalizeVehicleTitle } from "@/lib/catalogue/source-title";
import {
  compareVehicles,
  getCommercialConditionsTool,
  getCurrentOffersTool,
  getVehicleDetails,
  searchVehicles,
} from "@/lib/catalogue/catalogue-service";
import {
  buildPriceLookupDiagnostic,
  formatPriceSummaryLines,
  formatResolvedPriceForUser,
  formatResolvedPriceForGrounding,
  resolveBestPriceForModel,
  resolvedPriceToFact,
  type PriceLookupDiagnostic,
  type ResolvedPrice,
} from "@/lib/catalogue/price-retrieval";
import {
  getModelSummariesByIds,
  getModelSummariesBySlugs,
  searchModelsByPublishedFacts,
} from "@/lib/catalogue/repositories/catalogue-repository";
import { understandQuery, understandQueryFromMessages } from "@/lib/catalogue/query-understanding";
import type {
  CatalogueVariantSummary,
  CommercialConditionResult,
  QueryIntent,
  SourceReference,
} from "@/lib/catalogue/types";
import {
  extractCatalogueContextFromRetrieval,
  resolveConversationContext,
  type CatalogueConversationContext,
} from "@/lib/chat/conversation-context";

import { CHAT_ERRORS } from "./errors";

export type VerifiedSource = {
  id: string;
  title: string;
  url: string | null;
  checkedAt: string | null;
  sourceType?: string | null;
  vehicleId?: string | null;
  commercialCondition?: string | null;
};

export type VerifiedFact = {
  field: string;
  value: string | number | boolean | null;
  unit?: string | null;
  vehicleId?: string | null;
  modelId?: string | null;
  scope?: "model" | "variant" | "offer";
  sourceId: string;
  confidence: "verified";
  priceScope?: string;
  sourceUrl?: string | null;
  sourceTitle?: string;
  observedAt?: string;
  offerCondition?: string | null;
  selectionReason?: string;
};

export type RetrievalResult = {
  facts: VerifiedFact[];
  sources: VerifiedSource[];
  commercialConditions: VerifiedFact[];
  hasVerifiedContext: boolean;
  missingFields?: string[];
  conflicts?: string[];
  ambiguityMessage?: string;
  catalogueContext?: CatalogueConversationContext | null;
  priceSummary?: string;
  directAnswer?: string;
  priceDiagnostics?: PriceLookupDiagnostic[];
};

function emptyRetrieval(): RetrievalResult {
  return {
    facts: [],
    sources: [],
    commercialConditions: [],
    hasVerifiedContext: false,
    missingFields: [],
    conflicts: [],
  };
}

function toVerifiedSource(source: SourceReference): VerifiedSource {
  return {
    id: source.id,
    title: source.title,
    url: source.url,
    checkedAt: source.checkedAt,
    sourceType: source.sourceType,
    vehicleId: source.variantId ?? source.modelId ?? null,
  };
}

function variantFacts(variant: CatalogueVariantSummary): VerifiedFact[] {
  return variant.specifications.map((spec) => ({
    field: spec.fieldKey,
    value: spec.value,
    unit: spec.unit,
    vehicleId: variant.id,
    sourceId: spec.source.id,
    confidence: "verified" as const,
    sourceUrl: spec.source.url,
    sourceTitle: spec.source.title,
    observedAt: spec.source.checkedAt,
  }));
}

function variantOfferFacts(variant: CatalogueVariantSummary): VerifiedFact[] {
  return variant.currentOffers.flatMap((offer) => {
    const facts: VerifiedFact[] = [];
    if (offer.currentPrice !== null) {
      facts.push({
        field: "current_price",
        value: offer.currentPrice,
        unit: offer.currency,
        vehicleId: variant.id,
        sourceId: offer.source.id,
        confidence: "verified",
        sourceUrl: offer.offerUrl ?? offer.source.url,
        sourceTitle: offer.source.title,
        observedAt: offer.observedAt,
        offerCondition: offer.condition,
      });
    }
    facts.push({
      field: "availability_status",
      value: offer.availabilityStatus,
      vehicleId: variant.id,
      sourceId: offer.source.id,
      confidence: "verified",
      sourceUrl: offer.offerUrl ?? offer.source.url,
      sourceTitle: offer.source.title,
      observedAt: offer.observedAt,
      offerCondition: offer.condition,
    });
    return facts;
  });
}

function collectSources(
  variants: CatalogueVariantSummary[],
  commercial: CommercialConditionResult[] = [],
): VerifiedSource[] {
  const map = new Map<string, VerifiedSource>();

  for (const variant of variants) {
    for (const spec of variant.specifications) {
      map.set(spec.source.id, toVerifiedSource(spec.source));
    }
    for (const offer of variant.currentOffers) {
      map.set(offer.source.id, toVerifiedSource(offer.source));
    }
  }

  for (const condition of commercial) {
    map.set(condition.source.id, {
      ...toVerifiedSource(condition.source),
      commercialCondition: condition.conditionType,
    });
  }

  return [...map.values()];
}

function buildVariantContext(variants: CatalogueVariantSummary[]) {
  const facts = variants.flatMap((variant) => [
    ...variantFacts(variant),
    ...variantOfferFacts(variant),
  ]);
  const missingFields = [...new Set(variants.flatMap((variant) => variant.missingFields))];
  const conflicts = [...new Set(variants.flatMap((variant) => variant.conflictingFields))];

  return {
    facts,
    sources: collectSources(variants),
    missingFields,
    conflicts,
    hasVerifiedContext: facts.length > 0,
  };
}

function resolveSourceUrl(
  resolved: ResolvedPrice,
  model: Awaited<ReturnType<typeof getModelSummariesByIds>>[number],
) {
  if (resolved.sourceUrl) {
    return resolved.sourceUrl;
  }

  const matchingSpec = model.specifications.find(
    (spec) => spec.source.id === resolved.sourceId,
  );
  return matchingSpec?.source.url ?? null;
}

async function buildPriceContextForModels(
  modelSummaries: Awaited<ReturnType<typeof getModelSummariesByIds>>,
  variantsByModel = new Map<string, CatalogueVariantSummary[]>(),
) {
  const facts: VerifiedFact[] = [];
  const sources: VerifiedSource[] = [];
  const priceLines: string[] = [];
  const userPriceLines: string[] = [];
  const resolvedPrices: ResolvedPrice[] = [];
  const diagnostics: PriceLookupDiagnostic[] = [];

  for (const model of modelSummaries) {
    const variants =
      variantsByModel.get(model.id) ??
      (
        await getVehicleDetails({
          brand: model.brandSlug,
          model: model.slug,
        })
      ).variants;
    const resolved = resolveBestPriceForModel(model, variants);
    diagnostics.push(buildPriceLookupDiagnostic(model, resolved));

    if (!resolved) {
      userPriceLines.push(
        `- ${normalizeVehicleTitle(model.brandName, model.name)} — ověřenou aktuální cenu zatím nemám.`,
      );
      priceLines.push(
        `- ${normalizeVehicleTitle(model.brandName, model.name)}: ověřenou aktuální cenu zatím nemám (žádná ověřená modelová, variantní ani aktuální nabídková cena).`,
      );
      continue;
    }

    resolvedPrices.push(resolved);
    userPriceLines.push(`- ${formatResolvedPriceForUser(resolved)}`);
    facts.push(resolvedPriceToFact(resolved));
    priceLines.push(formatResolvedPriceForGrounding(resolved));
    sources.push({
      id: resolved.sourceId,
      title: resolved.sourceTitle,
      url: resolveSourceUrl(resolved, model),
      checkedAt: resolved.observedAt,
      sourceType:
        resolved.scope === "stock_offer" ||
        resolved.scope === "action_price" ||
        resolved.scope === "variant_offer"
          ? "offer"
          : "catalogue",
      vehicleId: resolved.variantId ?? resolved.modelId,
    });
  }

  return {
    facts,
    sources,
    priceLines,
    resolvedPrices,
    diagnostics,
    priceSummary: formatPriceSummaryLines(userPriceLines),
    hasVerifiedContext: facts.length > 0 || priceLines.length > 0,
  };
}

async function resolveModelsForPriorSearch(
  priorSearch: NonNullable<QueryIntent["priorSearch"]>,
) {
  const [variantSearch, publishedModels] = await Promise.all([
    searchVehicles({
      brand: priorSearch.brand,
      model: priorSearch.model,
      minimumWltpRange: priorSearch.minimumWltpRange,
      minimumRealRange: priorSearch.minimumRealRange,
      minimumBootCapacity: priorSearch.minimumBootCapacity,
      minimumSeats: priorSearch.minimumSeats,
      maximumPrice: priorSearch.maximumPrice,
      drivetrain: priorSearch.drivetrain,
      availability: priorSearch.availability,
      requiredFeature: priorSearch.requiredFeature as never,
      limit: 10,
    }),
    searchModelsByPublishedFacts({
      minimumWltpRange: priorSearch.minimumWltpRange,
      maximumPrice: priorSearch.maximumPrice,
      limit: 10,
    }),
  ]);

  const modelMap = new Map<
    string,
    Awaited<ReturnType<typeof getModelSummariesByIds>>[number]
  >();
  for (const model of publishedModels) {
    modelMap.set(model.id, model);
  }

  const slugPairs = [
    ...new Set(
      variantSearch.variants.map(
        (variant) => `${variant.brandSlug}/${variant.modelSlug}`,
      ),
    ),
  ].map((key) => {
    const [brand, model] = key.split("/");
    return { brand: brand!, model: model! };
  });

  const variantModels = await getModelSummariesBySlugs(slugPairs);
  for (const model of variantModels) {
    modelMap.set(model.id, model);
  }

  const variantsByModel = new Map<string, CatalogueVariantSummary[]>();
  for (const variant of variantSearch.variants) {
    const modelSummary = variantModels.find(
      (model) =>
        model.brandSlug === variant.brandSlug && model.slug === variant.modelSlug,
    );
    if (!modelSummary) continue;
    const bucket = variantsByModel.get(modelSummary.id) ?? [];
    bucket.push(variant);
    variantsByModel.set(modelSummary.id, bucket);
  }

  return {
    models: [...modelMap.values()],
    variantsByModel,
  };
}

function formatVariantLabel(variant: CatalogueVariantSummary) {
  return `${normalizeVehicleTitle(variant.brandName, variant.modelName)} – ${variant.name}`;
}

function formatVariantSection(variant: CatalogueVariantSummary) {
  const lines = [
    `VARIANTA: ${formatVariantLabel(variant)}`,
    ...variant.specifications.map(
      (spec) =>
        `- ${spec.fieldKey}: ${String(spec.value)}${spec.unit ? ` ${spec.unit}` : ""} (zdroj: ${spec.source.title}${spec.source.url ? `, ${spec.source.url}` : ""})`,
    ),
  ];

  if (variant.currentOffers.length > 0) {
    lines.push("AKTUÁLNÍ NABÍDKY:");
    for (const offer of variant.currentOffers) {
      lines.push(
        `- ${offer.title}: ${offer.currentPrice ?? "cena neuvedena"} ${offer.currency}, dostupnost ${offer.availabilityStatus}, stav ${offer.condition}, pozorováno ${offer.observedAt} (zdroj: ${offer.source.title}${offer.source.url ? `, ${offer.source.url}` : ""})`,
      );
    }
  }

  if (variant.missingFields.length > 0) {
    lines.push(`CHYBĚJÍCÍ POLE: ${variant.missingFields.join(", ")}`);
  }

  if (variant.conflictingFields.length > 0) {
    lines.push(`KONFLIKTNÍ POLE: ${variant.conflictingFields.join(", ")}`);
  }

  return lines.join("\n");
}

export function deduplicateVerifiedSources(sources: VerifiedSource[]) {
  const byUrl = new Map<string, VerifiedSource>();
  const withoutUrl: VerifiedSource[] = [];

  for (const source of sources) {
    const normalizedTitle = source.title.trim().replace(/\s+/g, " ");
    const normalizedSource = {
      ...source,
      title: normalizedTitle,
    };

    if (!source.url) {
      withoutUrl.push(normalizedSource);
      continue;
    }

    const existing = byUrl.get(source.url);
    if (!existing) {
      byUrl.set(source.url, normalizedSource);
      continue;
    }

    if (!existing.checkedAt && normalizedSource.checkedAt) {
      byUrl.set(source.url, normalizedSource);
    }
  }

  return [...byUrl.values(), ...withoutUrl];
}

export async function retrieveVehicleContext(
  query: string,
  options?: {
    messages?: Array<{
      role: "user" | "assistant";
      parts: Array<{ text?: string; [key: string]: unknown }>;
    }>;
  },
): Promise<RetrievalResult> {
  try {
    const conversationContext = options?.messages?.length
      ? resolveConversationContext(options.messages)
      : {};

    const intent = options?.messages?.length
      ? understandQueryFromMessages(options.messages)
      : understandQuery(query);

    const enrichedIntent = {
      ...intent,
      modelIds: intent.modelIds ?? conversationContext.modelIds,
      variantIds: intent.variantIds ?? conversationContext.variantIds,
      targetModels: intent.targetModels ?? conversationContext.targetModels,
      priorSearch: intent.priorSearch ?? conversationContext.priorSearch,
    };

    if (
      enrichedIntent.intent === "out_of_scope" ||
      enrichedIntent.intent === "commercial_question"
    ) {
      return emptyRetrieval();
    }

    if (enrichedIntent.intent === "clarification_needed") {
      return {
        ...emptyRetrieval(),
        hasVerifiedContext: true,
        ambiguityMessage: enrichedIntent.clarificationReason,
      };
    }

    if (enrichedIntent.intent === "vehicle_search") {
      const result = await searchVehicles({
        brand: enrichedIntent.brand,
        model: enrichedIntent.model,
        minimumWltpRange: enrichedIntent.minimumWltpRange,
        minimumRealRange: enrichedIntent.minimumRealRange,
        minimumBootCapacity: enrichedIntent.minimumBootCapacity,
        minimumSeats: enrichedIntent.minimumSeats,
        maximumPrice: enrichedIntent.maximumPrice,
        drivetrain: enrichedIntent.drivetrain,
        availability: enrichedIntent.availability,
        requiredFeature: enrichedIntent.requiredFeature as never,
        limit: 10,
      });

      const publishedModels = await searchModelsByPublishedFacts({
        minimumWltpRange: enrichedIntent.minimumWltpRange,
        maximumPrice: enrichedIntent.maximumPrice,
        limit: 10,
      });

      const variantModelIdentifiers = [
        ...new Map(
          result.variants.map((variant) => [
            `${variant.brandSlug}/${variant.modelSlug}`,
            { brand: variant.brandSlug, model: variant.modelSlug },
          ]),
        ).values(),
      ];
      const variantModels = await getModelSummariesBySlugs(
        variantModelIdentifiers,
      );
      const modelsById = new Map(
        [...publishedModels, ...variantModels].map((model) => [model.id, model]),
      );
      const searchModels = [...modelsById.values()];
      const variantsByModel = new Map<string, CatalogueVariantSummary[]>();
      for (const variant of result.variants) {
        const model = variantModels.find(
          (candidate) =>
            candidate.brandSlug === variant.brandSlug &&
            candidate.slug === variant.modelSlug,
        );
        if (!model) continue;
        const variants = variantsByModel.get(model.id) ?? [];
        variants.push(variant);
        variantsByModel.set(model.id, variants);
      }

      const modelFacts: VerifiedFact[] = searchModels.flatMap((model) =>
        model.specifications.map((spec) => ({
          field:
            spec.fieldKey === "published_model_max_wltp_range_km"
              ? "published_model_max_wltp_range_km"
              : spec.fieldKey,
          value: spec.value,
          unit: spec.unit,
          vehicleId: model.id,
          modelId: model.id,
          scope: "model" as const,
          sourceId: spec.source.id,
          confidence: "verified" as const,
          sourceUrl: spec.source.url,
          sourceTitle: normalizeVehicleTitle(
            model.brandName,
            model.name,
            spec.source.title,
          ),
          observedAt: spec.source.checkedAt,
        })),
      );

      const priceContext = await buildPriceContextForModels(
        searchModels,
        variantsByModel,
      );
      const sortedVariants =
        enrichedIntent.sortByField && result.variants.length > 1
          ? [...result.variants].sort((left, right) => {
              const leftValue = Number(
                left.specifications.find(
                  (spec) => spec.fieldKey === enrichedIntent.sortByField,
                )?.value ?? 0,
              );
              const rightValue = Number(
                right.specifications.find(
                  (spec) => spec.fieldKey === enrichedIntent.sortByField,
                )?.value ?? 0,
              );
              return rightValue - leftValue;
            })
          : result.variants;

      const context = buildVariantContext(sortedVariants);
      const catalogueContext = extractCatalogueContextFromRetrieval({
        modelIds: [
          ...searchModels.map((model) => model.id),
          ...priceContext.facts
            .map((fact) => fact.modelId)
            .filter((id): id is string => Boolean(id)),
        ],
        variantIds: sortedVariants.map((variant) => variant.id),
        targetModels: searchModels.map((model) => ({
          brand: model.brandSlug,
          model: model.slug,
        })),
        priorSearch: {
          intent: "vehicle_search",
          brand: enrichedIntent.brand,
          model: enrichedIntent.model,
          minimumWltpRange: enrichedIntent.minimumWltpRange,
          minimumRealRange: enrichedIntent.minimumRealRange,
          minimumBootCapacity: enrichedIntent.minimumBootCapacity,
          minimumSeats: enrichedIntent.minimumSeats,
          maximumPrice: enrichedIntent.maximumPrice,
          drivetrain: enrichedIntent.drivetrain,
          availability: enrichedIntent.availability,
          requiredFeature: enrichedIntent.requiredFeature,
          sortByField: enrichedIntent.sortByField,
        },
      });
      const sourcesById = new Map<string, VerifiedSource>();
      for (const source of [
        ...context.sources,
        ...searchModels.flatMap((model) =>
          model.specifications.map((spec) => ({
            id: spec.source.id,
            title: normalizeVehicleTitle(
              model.brandName,
              model.name,
              spec.source.title,
            ),
            url: spec.source.url,
            checkedAt: spec.source.checkedAt,
            sourceType: spec.source.sourceType,
            vehicleId: model.id,
          })),
        ),
        ...priceContext.sources,
      ]) {
        sourcesById.set(source.id, source);
      }

      return {
        facts: [...context.facts, ...modelFacts, ...priceContext.facts],
        sources: deduplicateVerifiedSources([...sourcesById.values()]),
        commercialConditions: [],
        hasVerifiedContext:
          context.hasVerifiedContext ||
          modelFacts.length > 0 ||
          priceContext.hasVerifiedContext,
        missingFields: context.missingFields,
        conflicts: context.conflicts,
        ambiguityMessage:
          modelFacts.length > 0 && sortedVariants.length === 0
            ? "U některých modelů jsou k dispozici pouze modelové marketingové hodnoty (např. dojezd až X km). Konkrétní dojezd závisí na variantě."
            : undefined,
        catalogueContext,
        priceSummary: priceContext.priceSummary,
        priceDiagnostics: priceContext.diagnostics,
      };
    }

    if (enrichedIntent.intent === "vehicle_comparison" && enrichedIntent.models) {
      const comparison = await compareVehicles({
        identifiers: enrichedIntent.models,
      });
      const context = buildVariantContext(comparison.variants);
      return {
        facts: context.facts,
        sources: deduplicateVerifiedSources(context.sources),
        commercialConditions: [],
        hasVerifiedContext: context.hasVerifiedContext,
        missingFields: context.missingFields,
        conflicts: context.conflicts,
        ambiguityMessage: comparison.ambiguityMessage,
      };
    }

    if (
      enrichedIntent.intent === "vehicle_detail" ||
      enrichedIntent.intent === "offer_search"
    ) {
      if (enrichedIntent.modelIds?.length) {
        const models = await getModelSummariesByIds(enrichedIntent.modelIds);
        const priceContext = await buildPriceContextForModels(models);
        if (priceContext.hasVerifiedContext) {
          return {
            facts: priceContext.facts,
            sources: deduplicateVerifiedSources(priceContext.sources),
            commercialConditions: [],
            hasVerifiedContext: true,
            catalogueContext: extractCatalogueContextFromRetrieval({
              modelIds: enrichedIntent.modelIds,
            }),
            priceSummary: priceContext.priceSummary,
            directAnswer:
              enrichedIntent.intent === "offer_search"
                ? priceContext.priceSummary
                : undefined,
            priceDiagnostics: priceContext.diagnostics,
          };
        }
      }

      if (enrichedIntent.targetModels?.length) {
        const models = await getModelSummariesBySlugs(enrichedIntent.targetModels);
        const priceContext = await buildPriceContextForModels(models);
        if (priceContext.hasVerifiedContext) {
          return {
            facts: priceContext.facts,
            sources: deduplicateVerifiedSources(priceContext.sources),
            commercialConditions: [],
            hasVerifiedContext: true,
            catalogueContext: extractCatalogueContextFromRetrieval({
              modelIds: models.map((model) => model.id),
              targetModels: enrichedIntent.targetModels,
            }),
            priceSummary: priceContext.priceSummary,
            directAnswer:
              enrichedIntent.intent === "offer_search"
                ? priceContext.priceSummary
                : undefined,
            priceDiagnostics: priceContext.diagnostics,
          };
        }
      }

      if (enrichedIntent.priorSearch) {
        const { models, variantsByModel } = await resolveModelsForPriorSearch(
          enrichedIntent.priorSearch,
        );
        const priceContext = await buildPriceContextForModels(
          models,
          variantsByModel,
        );
        if (priceContext.hasVerifiedContext) {
          return {
            facts: priceContext.facts,
            sources: deduplicateVerifiedSources(priceContext.sources),
            commercialConditions: [],
            hasVerifiedContext: true,
            catalogueContext: extractCatalogueContextFromRetrieval({
              modelIds: models.map((model) => model.id),
              priorSearch: enrichedIntent.priorSearch,
            }),
            priceSummary: priceContext.priceSummary,
            directAnswer:
              enrichedIntent.intent === "offer_search"
                ? priceContext.priceSummary
                : undefined,
            priceDiagnostics: priceContext.diagnostics,
          };
        }
      }

      const details = await getVehicleDetails({
        brand: enrichedIntent.brand,
        model: enrichedIntent.model,
      });

      const modelSummaries =
        enrichedIntent.brand && enrichedIntent.model
          ? await getModelSummariesBySlugs([
              { brand: enrichedIntent.brand, model: enrichedIntent.model },
            ])
          : [];

      if (enrichedIntent.intent === "offer_search") {
        const offers = await getCurrentOffersTool({
          brand: enrichedIntent.brand,
          model: enrichedIntent.model,
          priceLimit: enrichedIntent.maximumPrice,
          availabilityStatus: enrichedIntent.availability,
          limit: 10,
        });

        const priceContext = await buildPriceContextForModels(
          modelSummaries,
          new Map(
            modelSummaries.map((model) => [model.id, details.variants]),
          ),
        );

        if (priceContext.hasVerifiedContext) {
          return {
            facts: priceContext.facts,
            sources: deduplicateVerifiedSources(priceContext.sources),
            commercialConditions: [],
            hasVerifiedContext: true,
            ambiguityMessage: details.ambiguityMessage,
            priceSummary: priceContext.priceSummary,
            directAnswer: priceContext.priceSummary,
            priceDiagnostics: priceContext.diagnostics,
          };
        }

        if (offers.length === 0 && details.variants.length === 0) {
          return emptyRetrieval();
        }
      }

      const context = buildVariantContext(details.variants);
      return {
        facts: context.facts,
        sources: deduplicateVerifiedSources(context.sources),
        commercialConditions: [],
        hasVerifiedContext: context.hasVerifiedContext,
        missingFields: context.missingFields,
        conflicts: context.conflicts,
        ambiguityMessage: details.ambiguityMessage,
      };
    }

    return emptyRetrieval();
  } catch (error) {
    console.error("Vehicle retrieval failed", error);
    return emptyRetrieval();
  }
}

export async function retrieveCommercialContext(
  query: string,
): Promise<RetrievalResult> {
  try {
    const intent = understandQuery(query);
    if (intent.intent !== "commercial_question") {
      return emptyRetrieval();
    }

    const conditions = await getCommercialConditionsTool({
      conditionTypes: (intent.conditionTypes ?? ["purchase_process"]) as never,
    });

    if (conditions.length === 0) {
      return emptyRetrieval();
    }

    const commercialConditions: VerifiedFact[] = conditions.map(
      (condition: CommercialConditionResult) => ({
        field: condition.conditionType,
        value: condition.content,
        sourceId: condition.source.id,
        confidence: "verified",
        sourceUrl: condition.source.url,
        sourceTitle: condition.source.title,
        observedAt: condition.source.checkedAt,
      }),
    );

    return {
      facts: [],
      commercialConditions,
      sources: deduplicateVerifiedSources(
        conditions.map((condition: CommercialConditionResult) => ({
          ...toVerifiedSource(condition.source),
          commercialCondition: condition.conditionType,
        })),
      ),
      hasVerifiedContext: true,
    };
  } catch (error) {
    console.error("Commercial retrieval failed", error);
    return emptyRetrieval();
  }
}

function formatFactForPrompt(fact: VerifiedFact) {
  const unit = fact.unit ? ` ${fact.unit}` : "";
  const scope = fact.priceScope
    ? `, rozsah ceny: ${fact.priceScope}`
    : fact.scope
      ? `, úroveň: ${fact.scope}`
      : "";
  const source = fact.sourceTitle
    ? `, zdroj: ${fact.sourceTitle}${fact.sourceUrl ? ` (${fact.sourceUrl})` : ""}`
    : "";
  const observed = fact.observedAt ? `, pozorováno ${fact.observedAt}` : "";
  const condition = fact.offerCondition ? `, stav vozu: ${fact.offerCondition}` : "";

  return `- ${fact.field}: ${String(fact.value)}${unit}${scope}${condition}${observed}${source}`;
}

export function formatSourceReferences(result: RetrievalResult): string {
  const sources = deduplicateVerifiedSources(result.sources);
  if (sources.length === 0) {
    return "";
  }

  return sources
    .map((source, index) => {
      const checked = source.checkedAt
        ? `ověřeno ${source.checkedAt}`
        : "datum ověření neuvedeno";
      const url = source.url ? `; ${source.url}` : "";
      const type = source.sourceType ? `; typ ${source.sourceType}` : "";
      const commercial = source.commercialCondition
        ? `; podmínka ${source.commercialCondition}`
        : "";
      return `- Zdroj ${index + 1}: ${source.title}; ${checked}${url}${type}${commercial}`;
    })
    .join("\n");
}

export function buildGroundedChatContext(result: RetrievalResult) {
  if (result.ambiguityMessage && result.facts.length === 0) {
    return {
      content: `UPŘESNĚNÍ: ${result.ambiguityMessage}`,
      sources: deduplicateVerifiedSources(result.sources),
      hasVerifiedContext: true,
      sourceReferencesText: formatSourceReferences(result),
    };
  }

  if (!result.hasVerifiedContext) {
    return {
      content:
        "OVĚŘENÝ KATALOG ZATÍM NENÍ PŘIPOJEN NEBO NEOBSAHUJE DATA PRO TENTO DOTAZ. Nejsou k dispozici žádná ověřená data o parametrech, cenách, dostupnosti ani obchodních podmínkách. Pro konkrétní čísla použij větu o chybějícím ověřeném údaji.",
      sources: [] as VerifiedSource[],
      hasVerifiedContext: false,
      sourceReferencesText: "",
    };
  }

  const sections = [
    result.priceSummary &&
      `OVĚŘENÉ CENY (POUŽIJ PŘESNĚ TUTO FORMULACI PRO KAŽDÝ MODEL):\n${result.priceSummary}`,
    result.priceDiagnostics?.length
      ? `INTERNÍ DIAGNOSTIKA CEN (NEUVÁDĚT UŽIVATELI):\n${result.priceDiagnostics
          .map(
            (row) =>
              `- ${row.brandName} ${row.model}: nalezeno=${row.priceFound}; cena=${row.chosenPrice ?? "žádná"}; rozsah=${row.priceScope}; zdroj=${row.sourceUrl ?? "neuveden"}; vyloučené=${row.excludedPriceRows.length}`,
          )
          .join("\n")}`
      : null,
    result.facts.length > 0 &&
      `OVĚŘENÁ DATA O VOZECH:\n${result.facts.map(formatFactForPrompt).join("\n")}`,
    result.commercialConditions.length > 0 &&
      `OVĚŘENÉ OBCHODNÍ PODMÍNKY:\n${result.commercialConditions
        .map(formatFactForPrompt)
        .join("\n")}`,
    result.missingFields && result.missingFields.length > 0
      ? `CHYBĚJÍCÍ OVĚŘENÁ POLE: ${result.missingFields.join(", ")}`
      : null,
    result.conflicts && result.conflicts.length > 0
      ? `KONFLIKTNÍ POLE (NEPOUŽÍVAT JAKO JISTÁ FAKTA): ${result.conflicts.join(", ")}`
      : null,
    result.ambiguityMessage ? `UPŘESNĚNÍ: ${result.ambiguityMessage}` : null,
  ].filter(Boolean);

  return {
    content:
      sections.join("\n\n") ||
      `OVĚŘENÝ KONTEXT JE PRÁZDNÝ. ${CHAT_ERRORS.missingVerifiedData}`,
    sources: deduplicateVerifiedSources(result.sources),
    hasVerifiedContext: true,
    sourceReferencesText: formatSourceReferences(result),
  };
}

export function mergeRetrievalResults(
  vehicle: RetrievalResult,
  commercial: RetrievalResult,
): RetrievalResult {
  const sourcesById = new Map<string, VerifiedSource>();
  for (const source of [...vehicle.sources, ...commercial.sources]) {
    sourcesById.set(source.id, source);
  }

  return {
    facts: [...vehicle.facts],
    commercialConditions: [...commercial.commercialConditions],
    sources: deduplicateVerifiedSources([...sourcesById.values()]),
    hasVerifiedContext:
      vehicle.hasVerifiedContext || commercial.hasVerifiedContext,
    missingFields: [
      ...new Set([...(vehicle.missingFields ?? []), ...(commercial.missingFields ?? [])]),
    ],
    conflicts: [
      ...new Set([...(vehicle.conflicts ?? []), ...(commercial.conflicts ?? [])]),
    ],
    ambiguityMessage: vehicle.ambiguityMessage ?? commercial.ambiguityMessage,
    catalogueContext: vehicle.catalogueContext ?? commercial.catalogueContext,
    priceSummary: vehicle.priceSummary ?? commercial.priceSummary,
    directAnswer: vehicle.directAnswer ?? commercial.directAnswer,
    priceDiagnostics: vehicle.priceDiagnostics ?? commercial.priceDiagnostics,
  };
}

export { formatVariantSection };
