import "server-only";

export const CHAT_ERRORS = {
  general:
    "Omlouváme se, odpověď se teď nepodařilo vytvořit. Zkuste to prosím znovu.",
  missingVerifiedData:
    "Ověřený údaj k tomuto parametru zatím nemám. Nechci jej odhadovat.",
  rateLimit:
    "Odeslali jste příliš mnoho dotazů. Zkuste to prosím za chvíli znovu.",
  missingOpenAI: "AI poradce zatím není nakonfigurovaný.",
  invalidRequest: "Neplatný požadavek chatu.",
  streamFailed: "Odpověď se nepodařilo dokončit. Zkuste to prosím znovu.",
} as const;
