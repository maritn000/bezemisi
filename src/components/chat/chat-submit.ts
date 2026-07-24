/**
 * Shared chat submission helpers used by suggested questions, manual input,
 * deep links, and retries so every entry point sends the same payload shape.
 */
export function prepareOutgoingChatText(text: string) {
  const trimmed = text.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function buildSendMessageInput(text: string) {
  const trimmed = prepareOutgoingChatText(text);
  if (!trimmed) return null;
  return { text: trimmed } as const;
}

export function canSubmitChatMessage(text: string, isBusy: boolean) {
  return prepareOutgoingChatText(text) !== null && !isBusy;
}
