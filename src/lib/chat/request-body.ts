/**
 * Canonical AI SDK v7 DefaultChatTransport request body shape for /api/chat.
 * Shared by regression tests and preview diagnostics.
 */
export function buildSdkChatRequestBody(
  text: string,
  messageId: string,
  options?: {
    chatId?: string;
    trigger?: "submit-message" | "regenerate-message";
    conversationId?: string;
  },
) {
  const chatId = options?.chatId ?? `chat-${messageId}`;
  const trigger = options?.trigger ?? "submit-message";

  return {
    id: chatId,
    trigger,
    messageId,
    ...(options?.conversationId
      ? { conversationId: options.conversationId }
      : {}),
    messages: [
      {
        id: messageId,
        role: "user" as const,
        parts: [{ type: "text" as const, text }],
      },
    ],
  };
}

/** AI SDK v7 follow-up payload with assistant history echoed from the UI stream. */
export function buildSdkMultiTurnChatRequestBody(
  followUpText: string,
  followUpMessageId: string,
  options?: {
    chatId?: string;
    assistantText?: string;
    userText?: string;
    userMessageId?: string;
    assistantMessageId?: string;
  },
) {
  const chatId = options?.chatId ?? `chat-${followUpMessageId}`;
  const userText = options?.userText ?? "umíš něco?";
  const userMessageId = options?.userMessageId ?? "user-message-1";
  const assistantMessageId = options?.assistantMessageId ?? "assistant-message-1";
  const assistantText =
    options?.assistantText ??
    "Ano, rád vám pomohu s informacemi o elektromobilech.";

  return {
    id: chatId,
    trigger: "submit-message" as const,
    messages: [
      {
        id: userMessageId,
        role: "user" as const,
        parts: [{ type: "text" as const, text: userText }],
      },
      {
        id: assistantMessageId,
        role: "assistant" as const,
        parts: [
          { type: "step-start" as const },
          {
            type: "text" as const,
            text: assistantText,
            providerMetadata: {
              openai: {
                itemId: "msg_test_item",
              },
            },
            state: "done" as const,
          },
        ],
      },
      {
        id: followUpMessageId,
        role: "user" as const,
        parts: [{ type: "text" as const, text: followUpText }],
      },
    ],
  };
}
