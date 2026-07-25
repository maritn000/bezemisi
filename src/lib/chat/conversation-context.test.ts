import assert from "node:assert/strict";
import test from "node:test";

import {
  buildCatalogueContextPart,
  CATALOGUE_CONTEXT_PART_TYPE,
  extractCatalogueContextFromRetrieval,
  resolveConversationContext,
} from "@/lib/chat/conversation-context";

test("buildCatalogueContextPart emits structured catalogue metadata", () => {
  const part = buildCatalogueContextPart({
    modelIds: ["model-1", "model-2"],
    targetModels: [{ brand: "kia", model: "ev3" }],
  });

  assert.ok(part);
  assert.equal(part?.type, CATALOGUE_CONTEXT_PART_TYPE);
  assert.deepEqual(part?.data, {
    modelIds: ["model-1", "model-2"],
    variantIds: [],
    targetModels: [{ brand: "kia", model: "ev3" }],
    priorSearch: null,
  });
});

test("resolveConversationContext reads structured assistant catalogue context", () => {
  const context = resolveConversationContext([
    {
      role: "user",
      parts: [{ text: "Která auta mají dojezd alespoň 450 km?" }],
    },
    {
      role: "assistant",
      parts: [
        { type: "text", text: "Nalezeny modely." },
        {
          type: CATALOGUE_CONTEXT_PART_TYPE,
          data: {
            modelIds: ["model-a", "model-b"],
            variantIds: [],
            targetModels: [],
          },
        },
      ],
    },
    {
      role: "user",
      parts: [{ text: "kolik stojí?" }],
    },
  ]);

  assert.deepEqual(context.modelIds, ["model-a", "model-b"]);
});

test("extractCatalogueContextFromRetrieval returns null for empty input", () => {
  assert.equal(extractCatalogueContextFromRetrieval({}), null);
});

test("structured catalogue context preserves prior search filters", () => {
  const priorSearch = {
    intent: "vehicle_search" as const,
    minimumWltpRange: 450,
    maximumPrice: 1_200_000,
  };
  const part = buildCatalogueContextPart({
    modelIds: ["model-a"],
    priorSearch,
  });

  assert.ok(part);
  const context = resolveConversationContext([
    {
      role: "assistant",
      parts: [part!],
    },
    {
      role: "user",
      parts: [{ text: "Kolik stojí?" }],
    },
  ]);

  assert.deepEqual(context.modelIds, ["model-a"]);
  assert.equal(context.priorSearch?.minimumWltpRange, 450);
  assert.equal(context.priorSearch?.maximumPrice, 1_200_000);
});
