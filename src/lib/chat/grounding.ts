import "server-only";

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
};

function emptyRetrieval(): RetrievalResult {
  return {
    facts: [],
    sources: [],
    commercialConditions: [],
    hasVerifiedContext: false,
  };
}

/**
 * Retrieval boundary for the next phase.
 * Must return only verified catalogue records — never invented vehicle data.
 */
export async function retrieveVehicleContext(
  query: string,
): Promise<RetrievalResult> {
  void query;
  return emptyRetrieval();
}

/**
 * Retrieval boundary for verified commercial conditions.
 */
export async function retrieveCommercialContext(
  query: string,
): Promise<RetrievalResult> {
  void query;
  return emptyRetrieval();
}

function formatFacts(facts: VerifiedFact[]) {
  return facts
    .map((fact) => {
      const unit = fact.unit ? ` ${fact.unit}` : "";
      const vehicle = fact.vehicleId ? ` (vozidlo ${fact.vehicleId})` : "";
      return `- ${fact.field}: ${String(fact.value)}${unit}${vehicle} [zdroj ${fact.sourceId}]`;
    })
    .join("\n");
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
  if (!result.hasVerifiedContext) {
    return {
      content:
        "OVĚŘENÝ KATALOG ZATÍM NENÍ PŘIPOJEN. Nejsou k dispozici žádná ověřená data o parametrech, cenách, dostupnosti ani obchodních podmínkách. Pro konkrétní čísla použij větu o chybějícím ověřeném údaji.",
      sources: [] as VerifiedSource[],
      hasVerifiedContext: false,
      sourceReferencesText: "",
    };
  }

  const sections = [
    result.facts.length > 0 &&
      `OVĚŘENÁ DATA O VOZECH:\n${formatFacts(result.facts)}`,
    result.commercialConditions.length > 0 &&
      `OVĚŘENÉ OBCHODNÍ PODMÍNKY:\n${formatFacts(result.commercialConditions)}`,
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
  };
}
