import assert from "node:assert/strict";
import test from "node:test";

import {
  buildGroundedChatContext,
  type RetrievalResult,
} from "@/lib/chat/grounding";

test("buildGroundedChatContext labels model-level starting prices with scope", () => {
  const result: RetrievalResult = {
    facts: [
      {
        field: "model-level starting price",
        value: 599_990,
        unit: "CZK",
        modelId: "model-inster",
        scope: "model",
        sourceId: "src-1",
        confidence: "verified",
      },
    ],
    commercialConditions: [],
    sources: [
      {
        id: "src-1",
        title: "Hyundai INSTER – katalog Bez emisí",
        url: "https://www.bezemisi.cz/elektromobily/hyundai/inster",
        checkedAt: "2026-07-24",
      },
    ],
    hasVerifiedContext: true,
  };

  const grounded = buildGroundedChatContext(result);
  assert.match(grounded.content, /model-level starting price/i);
  assert.match(grounded.content, /\[model\]/);
  assert.match(grounded.content, /599990/);
});
