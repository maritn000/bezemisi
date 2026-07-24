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
