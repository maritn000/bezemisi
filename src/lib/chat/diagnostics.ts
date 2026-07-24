import "server-only";

export type ChatErrorCategory =
  | "openai_not_configured"
  | "invalid_request"
  | "rate_limit"
  | "provider_error"
  | "unsupported_model"
  | "streaming_error"
  | "persistence_error"
  | "unknown";

type LogChatErrorInput = {
  category: ChatErrorCategory;
  message: string;
  model?: string;
  openaiConfigured?: boolean;
  persistenceEnabled?: boolean;
  providerStatus?: number;
  providerCode?: string;
  requestId?: string;
  cause?: unknown;
};

function safeErrorDetails(error: unknown) {
  if (!error || typeof error !== "object") {
    return { message: String(error) };
  }

  const record = error as Record<string, unknown>;
  const nested =
    record.cause && typeof record.cause === "object"
      ? (record.cause as Record<string, unknown>)
      : undefined;
  const issues =
    Array.isArray(record.issues) && record.issues.length > 0
      ? record.issues
          .slice(0, 5)
          .map((issue) => {
            if (!issue || typeof issue !== "object") return undefined;
            const entry = issue as Record<string, unknown>;
            return {
              path: Array.isArray(entry.path) ? entry.path.join(".") : undefined,
              code: typeof entry.code === "string" ? entry.code : undefined,
              message:
                typeof entry.message === "string" ? entry.message : undefined,
            };
          })
          .filter(Boolean)
      : undefined;

  return {
    name: typeof record.name === "string" ? record.name : undefined,
    message:
      typeof record.message === "string"
        ? record.message
        : nested && typeof nested.message === "string"
          ? nested.message
          : undefined,
    status:
      typeof record.status === "number"
        ? record.status
        : nested && typeof nested.status === "number"
          ? nested.status
          : undefined,
    code:
      typeof record.code === "string"
        ? record.code
        : nested && typeof nested.code === "string"
          ? nested.code
          : undefined,
    type:
      typeof record.type === "string"
        ? record.type
        : nested && typeof nested.type === "string"
          ? nested.type
          : undefined,
    requestId:
      typeof record.request_id === "string"
        ? record.request_id
        : nested && typeof nested.request_id === "string"
          ? nested.request_id
          : undefined,
    validationIssues: issues,
  };
}

export function categorizeProviderError(error: unknown): ChatErrorCategory {
  const details = safeErrorDetails(error);
  const message = (details.message ?? "").toLowerCase();

  if (
    message.includes("model") &&
    (message.includes("not found") ||
      message.includes("does not exist") ||
      message.includes("unsupported"))
  ) {
    return "unsupported_model";
  }

  if (
    details.status === 401 ||
    message.includes("incorrect api key") ||
    message.includes("invalid api key")
  ) {
    return "provider_error";
  }

  if (
    details.status === 429 ||
    message.includes("rate limit") ||
    message.includes("quota")
  ) {
    return "provider_error";
  }

  if (
    message.includes("billing") ||
    message.includes("insufficient_quota") ||
    message.includes("exceeded your current quota")
  ) {
    return "provider_error";
  }

  return "provider_error";
}

export function logChatError(input: LogChatErrorInput) {
  const details = input.cause ? safeErrorDetails(input.cause) : undefined;

  console.error(
    JSON.stringify({
      scope: "chat",
      category: input.category,
      message: input.message,
      model: input.model,
      openaiConfigured: input.openaiConfigured,
      persistenceEnabled: input.persistenceEnabled,
      providerStatus: input.providerStatus ?? details?.status,
      providerCode: input.providerCode ?? details?.code,
      providerType: details?.type,
      requestId: input.requestId ?? details?.requestId,
      providerMessage: details?.message,
      validationIssues: details?.validationIssues,
    }),
  );
}
