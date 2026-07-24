import assert from "node:assert/strict";
import test from "node:test";

import {
  buildSendMessageInput,
  canSubmitChatMessage,
  prepareOutgoingChatText,
} from "./chat-submit";
import { exampleQuestions } from "@/lib/site-content";
import { buildSdkChatRequestBody } from "@/lib/chat/request-body";
import { chatRequestSchema } from "@/lib/chat/validation";

const suggestedQuestion = exampleQuestions[0]!;
const manualQuestion = suggestedQuestion;

test("suggested and manual questions build the same sendMessage payload", () => {
  const suggested = buildSendMessageInput(suggestedQuestion);
  const manual = buildSendMessageInput(manualQuestion);

  assert.deepEqual(suggested, manual);
  assert.deepEqual(suggested, { text: suggestedQuestion });
});

test("suggested and manual questions build the same API request body", () => {
  const suggestedBody = buildSdkChatRequestBody(suggestedQuestion, "message");
  const manualBody = buildSdkChatRequestBody(manualQuestion, "message");

  assert.deepEqual(suggestedBody, manualBody);
  assert.equal(chatRequestSchema.safeParse(suggestedBody).success, true);
  assert.equal(chatRequestSchema.safeParse(manualBody).success, true);
});

test("suggested questions do not append hard-coded assistant content", () => {
  const payload = buildSendMessageInput(suggestedQuestion);
  assert.ok(payload);
  assert.equal("role" in payload, false);
  assert.equal("parts" in payload, false);
  assert.equal("content" in payload, false);
  assert.equal(payload.text, suggestedQuestion);
});

test("manual umíš něco? payload is accepted by chat validation", () => {
  const body = buildSdkChatRequestBody("umíš něco?", "vague-allowed");
  const result = chatRequestSchema.safeParse(body);
  assert.equal(result.success, true);
});

test("prepareOutgoingChatText trims and rejects empty input", () => {
  assert.equal(prepareOutgoingChatText("  ahoj  "), "ahoj");
  assert.equal(prepareOutgoingChatText("   "), null);
});

test("canSubmitChatMessage blocks empty and busy states", () => {
  assert.equal(canSubmitChatMessage("ahoj", false), true);
  assert.equal(canSubmitChatMessage("ahoj", true), false);
  assert.equal(canSubmitChatMessage("   ", false), false);
});

test("regenerate trigger uses the same validated request shape", () => {
  const body = buildSdkChatRequestBody("umíš něco?", "retry", {
    trigger: "regenerate-message",
  });
  assert.equal(body.trigger, "regenerate-message");
  assert.equal(chatRequestSchema.safeParse(body).success, true);
});
