import "server-only";

import { understandQuery } from "@/lib/catalogue/query-understanding";
import type { QueryIntent } from "@/lib/catalogue/types";

export type CatalogueConversationContext = {
  priorSearch?: NonNullable<QueryIntent["priorSearch"]>;
  targetModels?: Array<{ brand: string; model: string }>;
  modelIds?: string[];
  variantIds?: string[];
};

type ConversationMessage = {
  role: "user" | "assistant";
  parts: Array<{ text?: string; type?: string; data?: unknown; [key: string]: unknown }>;
};

const CATALOGUE_CONTEXT_PART_TYPE = "data-catalogue-context";

function getUserMessageTexts(messages: ConversationMessage[]) {
  return messages
    .filter((message) => message.role === "user")
    .map((message) =>
      message.parts
        .map((part) => (typeof part.text === "string" ? part.text : ""))
        .join("\n")
        .trim(),
    )
    .filter(Boolean);
}

function isPriceFollowUp(query: string) {
  const normalized = query.trim();
  return (
    /^(kolik stojí|a kolik stojí|jaká je cena|a cena|za kolik)\??$/i.test(
      normalized,
    ) ||
    /(z nich|z těch|u těch|z výše|z předchozí|z toho seznamu|které z nich|která z nich|těchto|těchle)/i.test(
      normalized,
    ) &&
      /(kolik stojí|cena|stojí|za kolik)/i.test(normalized)
  );
}

function parseCatalogueContextPart(
  part: ConversationMessage["parts"][number],
): CatalogueConversationContext | null {
  if (part.type !== CATALOGUE_CONTEXT_PART_TYPE) {
    return null;
  }

  const data = part.data;
  if (!data || typeof data !== "object") {
    return null;
  }

  const record = data as Record<string, unknown>;
  const modelIds = Array.isArray(record.modelIds)
    ? record.modelIds.filter((id): id is string => typeof id === "string")
    : undefined;
  const variantIds = Array.isArray(record.variantIds)
    ? record.variantIds.filter((id): id is string => typeof id === "string")
    : undefined;
  const targetModels = Array.isArray(record.targetModels)
    ? record.targetModels
        .map((entry) => {
          if (!entry || typeof entry !== "object") return null;
          const row = entry as Record<string, unknown>;
          if (typeof row.brand !== "string" || typeof row.model !== "string") {
            return null;
          }
          return { brand: row.brand, model: row.model };
        })
        .filter((entry): entry is { brand: string; model: string } => Boolean(entry))
    : undefined;

  if (!modelIds?.length && !variantIds?.length && !targetModels?.length) {
    return null;
  }

  return {
    modelIds,
    variantIds,
    targetModels,
  };
}

function extractStructuredContextFromMessages(
  messages: ConversationMessage[],
): CatalogueConversationContext | null {
  const assistantMessages = messages.filter((message) => message.role === "assistant");
  for (let index = assistantMessages.length - 1; index >= 0; index -= 1) {
    for (const part of assistantMessages[index]!.parts) {
      const parsed = parseCatalogueContextPart(part);
      if (parsed) {
        return parsed;
      }
    }
  }
  return null;
}

function findPriorVehicleSearchIntent(
  userTexts: string[],
): NonNullable<QueryIntent["priorSearch"]> | undefined {
  const priorIntents = userTexts.map((text) => understandQuery(text));
  const priorSearch = [...priorIntents]
    .reverse()
    .find(
      (candidate) =>
        candidate.intent === "vehicle_search" &&
        (typeof candidate.minimumWltpRange === "number" ||
          typeof candidate.maximumPrice === "number" ||
          typeof candidate.minimumBootCapacity === "number" ||
          typeof candidate.minimumSeats === "number" ||
          Boolean(candidate.brand) ||
          Boolean(candidate.model)),
    );

  if (!priorSearch || priorSearch.intent !== "vehicle_search") {
    return undefined;
  }

  return {
    intent: "vehicle_search",
    brand: priorSearch.brand,
    model: priorSearch.model,
    minimumWltpRange: priorSearch.minimumWltpRange,
    minimumRealRange: priorSearch.minimumRealRange,
    minimumBootCapacity: priorSearch.minimumBootCapacity,
    minimumSeats: priorSearch.minimumSeats,
    maximumPrice: priorSearch.maximumPrice,
    drivetrain: priorSearch.drivetrain,
    availability: priorSearch.availability,
    requiredFeature: priorSearch.requiredFeature,
    sortByField: priorSearch.sortByField,
  };
}

export function resolveConversationContext(
  messages: ConversationMessage[],
): CatalogueConversationContext {
  const structured = extractStructuredContextFromMessages(messages);
  if (structured) {
    return structured;
  }

  const userTexts = getUserMessageTexts(messages);
  const latest = userTexts.at(-1) ?? "";
  const previous = userTexts.slice(0, -1);
  if (!isPriceFollowUp(latest) || previous.length === 0) {
    return {};
  }

  const priorSearch = findPriorVehicleSearchIntent(previous);
  if (!priorSearch) {
    return {};
  }

  return { priorSearch };
}

export function extractCatalogueContextFromRetrieval(input: {
  modelIds?: string[];
  variantIds?: string[];
  targetModels?: Array<{ brand: string; model: string }>;
  priorSearch?: NonNullable<QueryIntent["priorSearch"]>;
}): CatalogueConversationContext | null {
  const modelIds = [...new Set(input.modelIds ?? [])];
  const variantIds = [...new Set(input.variantIds ?? [])];
  const targetModels = input.targetModels ?? [];

  if (
    modelIds.length === 0 &&
    variantIds.length === 0 &&
    targetModels.length === 0 &&
    !input.priorSearch
  ) {
    return null;
  }

  return {
    modelIds: modelIds.length > 0 ? modelIds : undefined,
    variantIds: variantIds.length > 0 ? variantIds : undefined,
    targetModels: targetModels.length > 0 ? targetModels : undefined,
    priorSearch: input.priorSearch,
  };
}

export function buildCatalogueContextPart(context: CatalogueConversationContext) {
  if (
    !context.modelIds?.length &&
    !context.variantIds?.length &&
    !context.targetModels?.length
  ) {
    return null;
  }

  return {
    type: CATALOGUE_CONTEXT_PART_TYPE,
    data: {
      modelIds: context.modelIds ?? [],
      variantIds: context.variantIds ?? [],
      targetModels: context.targetModels ?? [],
    },
  } as const;
}

export { CATALOGUE_CONTEXT_PART_TYPE, isPriceFollowUp };
