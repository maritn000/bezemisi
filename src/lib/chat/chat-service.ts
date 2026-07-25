import "server-only";

import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  streamText,
  type UIMessage,
} from "ai";

import {
  buildCatalogueContextPart,
  CATALOGUE_CONTEXT_PART_TYPE,
} from "./conversation-context";
import { getConversationRepository } from "./conversation-repository";
import {
  categorizeProviderError,
  logChatError,
} from "./diagnostics";
import { CHAT_ERRORS } from "./errors";
import {
  buildGroundedChatContext,
  deduplicateVerifiedSources,
  mergeRetrievalResults,
  retrieveCommercialContext,
  retrieveVehicleContext,
  type VerifiedSource,
} from "./grounding";
import { getMessageRepository } from "./message-repository";
import {
  getChatModelConfig,
  getConfiguredChatModelName,
  isOpenAIConfigured,
} from "./model-config";
import { stripInternalIdentifiers } from "./output-safeguard";
import { isClearlyOutOfScope } from "./scope";
import { buildSystemPrompt, REFUSAL } from "./system-prompt";
import type { ChatRequest } from "./validation";

function mapMessagesForRetrieval(messages: ChatRequest["messages"]) {
  return messages.map((message) => ({
    role: message.role,
    parts: message.parts.map((part) => {
      if (
        message.role === "assistant" &&
        part.type === CATALOGUE_CONTEXT_PART_TYPE
      ) {
        return part;
      }

      return {
        text: "text" in part && typeof part.text === "string" ? part.text : "",
        ...(typeof part.type === "string" ? { type: part.type } : {}),
      };
    }),
  }));
}

function persistenceEnabled() {
  return getConversationRepository().enabled;
}

function staticAssistantResponse(text: string, sources: VerifiedSource[] = []) {
  const sanitizedText = stripInternalIdentifiers(text);
  const partId = crypto.randomUUID();
  const stream = createUIMessageStream<UIMessage>({
    execute({ writer }) {
      writer.write({ type: "text-start", id: partId });
      writer.write({ type: "text-delta", id: partId, delta: sanitizedText });
      writer.write({ type: "text-end", id: partId });
      for (const source of deduplicateVerifiedSources(sources)) {
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

function createOutputSafeguardTransform() {
  return () =>
    new TransformStream({
      transform(chunk, controller) {
        if (chunk.type === "text-delta" && typeof chunk.text === "string") {
          controller.enqueue({
            ...chunk,
            text: stripInternalIdentifiers(chunk.text),
          });
          return;
        }
        controller.enqueue(chunk);
      },
    });
}

async function resolveConversationId(_requestedId?: string) {
  const conversations = getConversationRepository();
  if (!conversations.enabled) {
    return null;
  }

  try {
    // Conversation continuity across requests will be wired after catalogue
    // ingestion. Client-supplied IDs are validated by Zod but not trusted yet.
    void _requestedId;
    return await conversations.createConversation();
  } catch (error) {
    logChatError({
      category: "persistence_error",
      message: "Conversation creation failed; continuing without persistence",
      openaiConfigured: isOpenAIConfigured(),
      persistenceEnabled: true,
      cause: error,
    });
    return null;
  }
}

function logStreamError(error: unknown) {
  const model = getConfiguredChatModelName();
  logChatError({
    category: categorizeProviderError(error),
    message: "OpenAI chat stream failed",
    model,
    openaiConfigured: isOpenAIConfigured(),
    persistenceEnabled: persistenceEnabled(),
    cause: error,
  });
}

export async function handleChatRequest(parsedBody: ChatRequest) {
  const modelName = getConfiguredChatModelName();
  const latestMessage = parsedBody.messages.at(-1)!;
  const query = latestMessage.parts.map((part) => part.text).join("\n");

  if (isClearlyOutOfScope(query)) {
    return staticAssistantResponse(REFUSAL);
  }

  if (!isOpenAIConfigured()) {
    logChatError({
      category: "openai_not_configured",
      message: "OPENAI_API_KEY is not configured",
      model: modelName,
      openaiConfigured: false,
      persistenceEnabled: persistenceEnabled(),
    });
    return Response.json(
      { error: CHAT_ERRORS.missingOpenAI },
      { status: 503 },
    );
  }

  const [vehicleContext, commercialContext] = await Promise.all([
    retrieveVehicleContext(query, {
      messages: mapMessagesForRetrieval(parsedBody.messages),
    }),
    retrieveCommercialContext(query),
  ]);
  const retrieval = mergeRetrievalResults(vehicleContext, commercialContext);
  const groundedContext = buildGroundedChatContext(retrieval);
  const catalogueContextPart = retrieval.catalogueContext
    ? buildCatalogueContextPart(retrieval.catalogueContext)
    : null;

  // Never invent sources — only emit application retrieval results.
  const sourcesForUi = groundedContext.hasVerifiedContext
    ? deduplicateVerifiedSources(
        groundedContext.sources.filter((source) => Boolean(source.url)),
      )
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
      logChatError({
        category: "persistence_error",
        message: "Chat user message persistence failed",
        model: modelName,
        openaiConfigured: true,
        persistenceEnabled: true,
        cause: error,
      });
    }
  }

  const result = streamText({
    model,
    temperature,
    experimental_transform: createOutputSafeguardTransform(),
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
          content: stripInternalIdentifiers(text),
          sources: sourcesForUi,
        });
      } catch (error) {
        logChatError({
          category: "persistence_error",
          message: "Chat assistant message persistence failed",
          model: modelName,
          openaiConfigured: true,
          persistenceEnabled: true,
          cause: error,
        });
      }
    },
  });

  if (sourcesForUi.length === 0 && !catalogueContextPart) {
    return result.toUIMessageStreamResponse({
      onError(error) {
        logStreamError(error);
        return CHAT_ERRORS.streamFailed;
      },
    });
  }

  const stream = createUIMessageStream<UIMessage>({
    execute: async ({ writer }) => {
      writer.merge(
        result.toUIMessageStream({
          onError(error) {
            logStreamError(error);
            return CHAT_ERRORS.streamFailed;
          },
        }),
      );
      if (catalogueContextPart) {
        writer.write(catalogueContextPart);
      }
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
