import "server-only";

import { eq } from "drizzle-orm";

import { resolveDatabaseUrlFromEnv } from "@/lib/database-url";

export interface ConversationRepository {
  readonly enabled: boolean;
  createConversation(): Promise<string | null>;
  touchConversation(conversationId: string): Promise<void>;
  storeSafeError(input: {
    conversationId: string;
    code: string;
  }): Promise<void>;
}

class DisabledConversationRepository implements ConversationRepository {
  readonly enabled = false;

  async createConversation() {
    return null;
  }

  async touchConversation() {}

  async storeSafeError() {}
}

class DrizzleConversationRepository implements ConversationRepository {
  readonly enabled = true;

  async createConversation() {
    const [{ db }, { conversations }] = await Promise.all([
      import("@/db"),
      import("@/db/schema"),
    ]);
    const [conversation] = await db
      .insert(conversations)
      .values({ metadata: { source: "site-chat" } })
      .returning({ id: conversations.id });

    return conversation.id;
  }

  async touchConversation(conversationId: string) {
    const [{ db }, { conversations }] = await Promise.all([
      import("@/db"),
      import("@/db/schema"),
    ]);
    await db
      .update(conversations)
      .set({ updatedAt: new Date() })
      .where(eq(conversations.id, conversationId));
  }

  async storeSafeError(input: { conversationId: string; code: string }) {
    const [{ db }, { conversations }] = await Promise.all([
      import("@/db"),
      import("@/db/schema"),
    ]);
    await db
      .update(conversations)
      .set({
        metadata: { lastErrorCode: input.code },
        updatedAt: new Date(),
      })
      .where(eq(conversations.id, input.conversationId));
  }
}

function databaseIsConfigured() {
  try {
    resolveDatabaseUrlFromEnv();
    return true;
  } catch {
    return false;
  }
}

/**
 * Persistence requires both a database URL and an explicit capability flag.
 * Avoid writing to an unconfirmed database environment.
 */
export function getConversationRepository(): ConversationRepository {
  if (
    process.env.CHAT_PERSISTENCE_ENABLED === "true" &&
    databaseIsConfigured()
  ) {
    return new DrizzleConversationRepository();
  }

  if (process.env.CHAT_PERSISTENCE_ENABLED === "true") {
    console.warn(
      "CHAT_PERSISTENCE_ENABLED=true, ale databáze není nakonfigurovaná. Chat běží bez persistence.",
    );
  }

  return new DisabledConversationRepository();
}
