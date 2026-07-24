import "server-only";

import { eq } from "drizzle-orm";

import { resolveDatabaseUrlFromEnv } from "@/lib/database-url";

import type { VerifiedSource } from "./grounding";

type StoredMessageRole = "user" | "assistant";

export interface ConversationRepository {
  readonly enabled: boolean;
  createConversation(): Promise<string | null>;
  storeMessage(input: {
    conversationId: string;
    role: StoredMessageRole;
    content: string;
    sources?: VerifiedSource[];
  }): Promise<void>;
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

  async storeMessage() {}

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

  async storeMessage(input: {
    conversationId: string;
    role: StoredMessageRole;
    content: string;
    sources?: VerifiedSource[];
  }) {
    const [{ db }, { messages }] = await Promise.all([
      import("@/db"),
      import("@/db/schema"),
    ]);
    await db.insert(messages).values({
      conversationId: input.conversationId,
      role: input.role,
      content: input.content,
      metadata: { sources: input.sources ?? [] },
    });
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
 * This avoids writing to an unconfirmed database environment.
 */
export function getConversationRepository(): ConversationRepository {
  if (
    process.env.CHAT_PERSISTENCE_ENABLED === "true" &&
    databaseIsConfigured()
  ) {
    return new DrizzleConversationRepository();
  }

  return new DisabledConversationRepository();
}
