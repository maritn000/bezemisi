import "server-only";

import type { VerifiedSource } from "./grounding";
import { getConversationRepository } from "./conversation-repository";

type StoredMessageRole = "user" | "assistant";

export interface MessageRepository {
  readonly enabled: boolean;
  storeMessage(input: {
    conversationId: string;
    role: StoredMessageRole;
    content: string;
    sources?: VerifiedSource[];
  }): Promise<void>;
}

class DisabledMessageRepository implements MessageRepository {
  readonly enabled = false;

  async storeMessage() {}
}

class DrizzleMessageRepository implements MessageRepository {
  readonly enabled = true;

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
      metadata: {
        sources: (input.sources ?? []).map((source) => ({
          id: source.id,
          title: source.title,
          url: source.url,
          checkedAt: source.checkedAt,
          sourceType: source.sourceType ?? null,
          vehicleId: source.vehicleId ?? null,
        })),
      },
    });

    const conversations = getConversationRepository();
    if (conversations.enabled) {
      await conversations.touchConversation(input.conversationId);
    }
  }
}

export function getMessageRepository(): MessageRepository {
  return getConversationRepository().enabled
    ? new DrizzleMessageRepository()
    : new DisabledMessageRepository();
}
