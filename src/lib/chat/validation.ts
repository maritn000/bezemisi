import { z } from "zod";

export const MAX_MESSAGE_LENGTH = 4_000;
export const MAX_HISTORY_MESSAGES = 20;
export const MAX_TOTAL_HISTORY_LENGTH = 16_000;

const userTextPartSchema = z
  .object({
    type: z.literal("text"),
    text: z.string().trim().min(1).max(MAX_MESSAGE_LENGTH),
  })
  .strict();

const userMessageSchema = z
  .object({
    id: z.string().min(1).max(128),
    role: z.literal("user"),
    parts: z.array(userTextPartSchema).min(1).max(4),
  })
  .strict();

// Assistant history is echoed back by AI SDK v7 with step markers and provider metadata.
const assistantPartSchema = z
  .object({
    type: z.string().min(1).max(64),
  })
  .passthrough();

const assistantMessageSchema = z
  .object({
    id: z.string().min(1).max(128),
    role: z.literal("assistant"),
    parts: z.array(assistantPartSchema).min(1).max(32),
  })
  .passthrough();

const messageSchema = z.discriminatedUnion("role", [
  userMessageSchema,
  assistantMessageSchema,
]);

function messageTextLength(message: z.infer<typeof messageSchema>) {
  return message.parts.reduce((sum, part) => {
    const text = "text" in part && typeof part.text === "string" ? part.text : "";
    return sum + text.length;
  }, 0);
}

export type ChatRequest = {
  messages: z.infer<typeof messageSchema>[];
  conversationId?: string;
};

const chatRequestCoreSchema = z
  .object({
    messages: z.array(messageSchema).min(1).max(MAX_HISTORY_MESSAGES),
    conversationId: z.string().uuid().optional(),
    // AI SDK v7 DefaultChatTransport metadata — accepted but not trusted.
    id: z.string().min(1).max(128).optional(),
    trigger: z.enum(["submit-message", "regenerate-message"]).optional(),
    messageId: z.string().min(1).max(128).optional(),
  })
  .strict()
  .refine(
    ({ messages }) => messages.at(-1)?.role === "user",
    "The last message must be from the user",
  )
  .refine(
    ({ messages }) =>
      messages.reduce((total, message) => total + messageTextLength(message), 0) <=
      MAX_TOTAL_HISTORY_LENGTH,
    "Conversation history is too long",
  )
  .transform(({ messages, conversationId }): ChatRequest => ({
    messages,
    conversationId,
  }));

export const chatRequestSchema = chatRequestCoreSchema;
