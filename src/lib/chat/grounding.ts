import "server-only";

import {
  compareVehicles,
  getCommercialConditionsTool,
  getCurrentOffersTool,
  getVehicleDetails,
  searchVehicles,
} from "@/lib/catalogue/catalogue-service";
import { understandQuery } from "@/lib/catalogue/query-understanding";
import type {
  CatalogueVariantSummary,
  CommercialConditionResult,
  SourceReference,
} from "@/lib/catalogue/types";

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
  sourceId: string;
  confidence: "verified";
};

export type RetrievalResult = {
  facts: VerifiedFact[];
  sources: VerifiedSource[];
  commercialConditions: VerifiedFact[];
  hasVerifiedContext: boolean;
  missingFields?: string[];
  conflicts?: string[];
  ambiguityMessage?: string;
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
      });
    }
    facts.push({
      field: "availability_status",
      value: offer.availabilityStatus,
      vehicleId: variant.id,
      sourceId: offer.source.id,
      confidence: "verified",
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

function formatVariantLabel(variant: CatalogueVariantSummary) {
  return `${variant.brandName} ${variant.modelName} – ${variant.name}`;
}

function formatVariantSection(variant: CatalogueVariantSummary) {
  const lines = [
    `VARIANTA: ${formatVariantLabel(variant)} [${variant.id}]`,
    ...variant.specifications.map(
      (spec) =>
        `- ${spec.fieldKey}: ${String(spec.value)}${spec.unit ? ` ${spec.unit}` : ""} [zdroj ${spec.source.id}]`,
    ),
  ];

  if (variant.currentOffers.length > 0) {
    lines.push("AKTUÁLNÍ NABÍDKY:");
    for (const offer of variant.currentOffers) {
      lines.push(
        `- ${offer.title}: ${offer.currentPrice ?? "cena neuvedena"} ${offer.currency}, dostupnost ${offer.availabilityStatus}, pozorováno ${offer.observedAt} [zdroj ${offer.source.id}]`,
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

export async function retrieveVehicleContext(
  query: string,
): Promise<RetrievalResult> {
  try {
    const intent = understandQuery(query);

    if (
      intent.intent === "out_of_scope" ||
      intent.intent === "commercial_question"
    ) {
      return emptyRetrieval();
    }

    if (intent.intent === "clarification_needed") {
      return {
        ...emptyRetrieval(),
        hasVerifiedContext: true,
        ambiguityMessage: intent.clarificationReason,
      };
    }

    if (intent.intent === "vehicle_search") {
      const result = await searchVehicles({
        brand: intent.brand,
        model: intent.model,
        minimumWltpRange: intent.minimumWltpRange,
        minimumRealRange: intent.minimumRealRange,
        minimumBootCapacity: intent.minimumBootCapacity,
        minimumSeats: intent.minimumSeats,
        maximumPrice: intent.maximumPrice,
        drivetrain: intent.drivetrain,
        availability: intent.availability,
        requiredFeature: intent.requiredFeature as never,
        limit: 10,
      });

      const context = buildVariantContext(result.variants);
      return {
        facts: context.facts,
        sources: context.sources,
        commercialConditions: [],
        hasVerifiedContext: context.hasVerifiedContext,
        missingFields: context.missingFields,
        conflicts: context.conflicts,
      };
    }

    if (intent.intent === "vehicle_comparison" && intent.models) {
      const comparison = await compareVehicles({
        identifiers: intent.models,
      });
      const context = buildVariantContext(comparison.variants);
      return {
        facts: context.facts,
        sources: context.sources,
        commercialConditions: [],
        hasVerifiedContext: context.hasVerifiedContext,
        missingFields: context.missingFields,
        conflicts: context.conflicts,
        ambiguityMessage: comparison.ambiguityMessage,
      };
    }

    if (intent.intent === "vehicle_detail" || intent.intent === "offer_search") {
      const details = await getVehicleDetails({
        brand: intent.brand,
        model: intent.model,
      });

      if (intent.intent === "offer_search") {
        const offers = await getCurrentOffersTool({
          brand: intent.brand,
          model: intent.model,
          priceLimit: intent.maximumPrice,
          availabilityStatus: intent.availability,
          limit: 10,
        });

        if (offers.length === 0 && details.variants.length === 0) {
          return emptyRetrieval();
        }
      }

      const context = buildVariantContext(details.variants);
      return {
        facts: context.facts,
        sources: context.sources,
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
      }),
    );

    return {
      facts: [],
      commercialConditions,
      sources: conditions.map((condition: CommercialConditionResult) => ({
        ...toVerifiedSource(condition.source),
        commercialCondition: condition.conditionType,
      })),
      hasVerifiedContext: true,
    };
  } catch (error) {
    console.error("Commercial retrieval failed", error);
    return emptyRetrieval();
  }
}

export function formatSourceReferences(result: RetrievalResult): string {
  if (result.sources.length === 0) {
    return "";
  }

  return result.sources
    .map((source) => {
      const checked = source.checkedAt
        ? `ověřeno ${source.checkedAt}`
        : "datum ověření neuvedeno";
      const url = source.url ? `; ${source.url}` : "";
      const type = source.sourceType ? `; typ ${source.sourceType}` : "";
      const vehicle = source.vehicleId
        ? `; vozidlo ${source.vehicleId}`
        : "";
      const commercial = source.commercialCondition
        ? `; podmínka ${source.commercialCondition}`
        : "";
      return `- [${source.id}] ${source.title}; ${checked}${url}${type}${vehicle}${commercial}`;
    })
    .join("\n");
}

export function buildGroundedChatContext(result: RetrievalResult) {
  if (result.ambiguityMessage && result.facts.length === 0) {
    return {
      content: `UPŘESNĚNÍ: ${result.ambiguityMessage}`,
      sources: result.sources,
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
    result.facts.length > 0 &&
      `OVĚŘENÁ DATA O VOZECH:\n${result.facts
        .map((fact) => {
          const unit = fact.unit ? ` ${fact.unit}` : "";
          const vehicle = fact.vehicleId ? ` (varianta ${fact.vehicleId})` : "";
          return `- ${fact.field}: ${String(fact.value)}${unit}${vehicle} [zdroj ${fact.sourceId}]`;
        })
        .join("\n")}`,
    result.commercialConditions.length > 0 &&
      `OVĚŘENÉ OBCHODNÍ PODMÍNKY:\n${result.commercialConditions
        .map(
          (fact) =>
            `- ${fact.field}: ${String(fact.value)} [zdroj ${fact.sourceId}]`,
        )
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
    sources: result.sources,
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
    sources: [...sourcesById.values()],
    hasVerifiedContext:
      vehicle.hasVerifiedContext || commercial.hasVerifiedContext,
    missingFields: [
      ...new Set([...(vehicle.missingFields ?? []), ...(commercial.missingFields ?? [])]),
    ],
    conflicts: [
      ...new Set([...(vehicle.conflicts ?? []), ...(commercial.conflicts ?? [])]),
    ],
    ambiguityMessage: vehicle.ambiguityMessage ?? commercial.ambiguityMessage,
  };
}

export { formatVariantSection };
