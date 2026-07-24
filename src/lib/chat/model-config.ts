import "server-only";

import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";

const modelNameSchema = z
  .string()
  .trim()
  .min(1)
  .max(100)
  .regex(/^[a-zA-Z0-9._-]+$/);

/** Single source of truth for the chat model name. */
export const DEFAULT_OPENAI_CHAT_MODEL = "gpt-4.1-mini";

export function isOpenAIConfigured() {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

export function getConfiguredChatModelName() {
  return modelNameSchema.parse(
    process.env.OPENAI_CHAT_MODEL || DEFAULT_OPENAI_CHAT_MODEL,
  );
}

export function getChatModelConfig() {
  const apiKey = z
    .string()
    .trim()
    .min(1, "OPENAI_API_KEY is not configured")
    .parse(process.env.OPENAI_API_KEY);
  const openai = createOpenAI({ apiKey });

  return {
    model: openai(getConfiguredChatModelName()),
    temperature: 0.2,
  };
}
