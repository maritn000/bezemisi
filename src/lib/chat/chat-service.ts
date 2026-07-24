import "server-only";

import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  streamText,
  type UIMessage,
} from "ai";

import { getConversationRepository } from "./conversation-repository";
import { CHAT_ERRORS } from "./errors";
import {
  buildGroundedChatContext,
  mergeRetrievalResults,
  retrieveCommercialContext,
  retrieveVehicleContext,
  type VerifiedSource,
} from "./grounding";
import { getMessageRepository } from "./message-repository";
import { getChatModelConfig, isOpenAIConfigured } from "./model-config";
import { isClearlyOutOfScope } from "./scope";
import { buildSystemPrompt, REFUSAL } from "./system-prompt";
import type { ChatRequest } from "./validation";

function staticAssistantResponse(text: string, sources: VerifiedSource[] = []) {
  const partId = crypto.randomUUID();
  const stream = createUIMessageStream<UIMessage>({
    execute({ writer }) {
      writer.write({ type: "text-start", id: partId });
      writer.write({ type: "text-delta", id: partId, delta: text });
      writer.write({ type: "text-end", id: partId });
      for (const source of sources) {
        if (!source.url) continue;
        writer.write({
          type: "source-url",
          sourceId: source.id,
          url: source.url,
          title: source.title,
        });
      }
    },
  });

  return createUIMessageStreamResponse({ stream });
}

async function resolveConversationId(_requestedId?: string) {
  const conversations = getConversationRepository();
  if (!conversations.enabled) {
    return null;
  }

  // Conversation continuity across requests will be wired after catalogue
  // ingestion. Client-supplied IDs are validated by Zod but not trusted yet.
  void _requestedId;
  return conversations.createConversation();
}

export async function handleChatRequest(parsedBody: ChatRequest) {
  if (!isOpenAIConfigured()) {
    return Response.json(
      { error: CHAT_ERRORS.missingOpenAI },
      { status: 503 },
    );
  }

  const latestMessage = parsedBody.messages.at(-1)!;
  const query = latestMessage.parts.map((part) => part.text).join("\n");

  if (isClearlyOutOfScope(query)) {
    return staticAssistantResponse(REFUSAL);
  }

  const [vehicleContext, commercialContext] = await Promise.all([
    retrieveVehicleContext(query),
    retrieveCommercialContext(query),
  ]);
  const retrieval = mergeRetrievalResults(vehicleContext, commercialContext);
  const groundedContext = buildGroundedChatContext(retrieval);

  // Never invent sources — only emit application retrieval results.
  const sourcesForUi = groundedContext.hasVerifiedContext
    ? groundedContext.sources.filter((source) => Boolean(source.url))
    : [];

  const { model, temperature } = getChatModelConfig();
  const conversationId = await resolveConversationId(
    parsedBody.conversationId,
  );
  const messages = getMessageRepository();

  if (conversationId) {
    try {
      await messages.storeMessage({
        conversationId,
        role: "user",
        content: query,
      });
    } catch (error) {
      console.error("Chat user message persistence failed", error);
    }
  }

  const result = streamText({
    model,
    temperature,
    system: buildSystemPrompt({
      context: groundedContext.content,
      sources: groundedContext.sources,
      sourceReferencesText: groundedContext.sourceReferencesText,
    }),
    messages: await convertToModelMessages(parsedBody.messages as UIMessage[]),
    onFinish: async ({ text }) => {
      if (!conversationId) return;
      try {
        await messages.storeMessage({
          conversationId,
          role: "assistant",
          content: text,
          sources: groundedContext.sources,
        });
      } catch (error) {
        console.error("Chat assistant message persistence failed", error);
      }
    },
  });

  if (sourcesForUi.length === 0) {
    return result.toUIMessageStreamResponse({
      onError(error) {
        console.error("OpenAI chat stream failed", error);
        return CHAT_ERRORS.streamFailed;
      },
    });
  }

  const stream = createUIMessageStream<UIMessage>({
    execute: async ({ writer }) => {
      writer.merge(
        result.toUIMessageStream({
          onError(error) {
            console.error("OpenAI chat stream failed", error);
            return CHAT_ERRORS.streamFailed;
          },
        }),
      );
      for (const source of sourcesForUi) {
        writer.write({
          type: "source-url",
          sourceId: source.id,
          url: source.url!,
          title: source.title,
        });
      }
    },
  });

  return createUIMessageStreamResponse({ stream });
}
