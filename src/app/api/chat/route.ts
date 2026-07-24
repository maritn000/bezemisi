import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  streamText,
  type UIMessage,
} from "ai";

import {
  buildGroundedChatContext,
  retrieveCommercialContext,
  retrieveVehicleContext,
} from "@/lib/chat/grounding";
import { getChatModelConfig } from "@/lib/chat/model-config";
import { getConversationRepository } from "@/lib/chat/persistence";
import {
  getChatRateLimiter,
  getRequestRateLimitKey,
} from "@/lib/chat/rate-limit";
import { isClearlyOutOfScope } from "@/lib/chat/scope";
import { buildSystemPrompt, REFUSAL } from "@/lib/chat/system-prompt";
import {
  chatRequestSchema,
  type ChatRequest,
} from "@/lib/chat/validation";

export const runtime = "nodejs";
export const maxDuration = 30;

function publicError(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

function staticAssistantResponse(text: string) {
  const partId = crypto.randomUUID();
  const stream = createUIMessageStream<UIMessage>({
    execute({ writer }) {
      writer.write({ type: "text-start", id: partId });
      writer.write({ type: "text-delta", id: partId, delta: text });
      writer.write({ type: "text-end", id: partId });
    },
  });

  return createUIMessageStreamResponse({ stream });
}

export async function POST(request: Request) {
  const rateLimit = await getChatRateLimiter().check(
    getRequestRateLimitKey(request),
  );
  if (!rateLimit.allowed) {
    return new Response(
      JSON.stringify({
        error: "Příliš mnoho požadavků. Zkuste to prosím za chvíli.",
      }),
      {
        status: 429,
        headers: {
          "content-type": "application/json",
          "retry-after": String(rateLimit.retryAfterSeconds),
        },
      },
    );
  }

  let parsedBody: ChatRequest;
  try {
    parsedBody = chatRequestSchema.parse(await request.json());
  } catch {
    return publicError("Neplatný požadavek chatu.", 400);
  }

  const latestMessage = parsedBody.messages.at(-1)!;
  const query = latestMessage.parts.map((part) => part.text).join("\n");

  if (isClearlyOutOfScope(query)) {
    return staticAssistantResponse(REFUSAL);
  }

  try {
    const [vehicleContext, commercialContext] = await Promise.all([
      retrieveVehicleContext(query),
      retrieveCommercialContext(query),
    ]);
    const groundedContext = buildGroundedChatContext({
      vehicle: vehicleContext,
      commercial: commercialContext,
    });
    const { model, temperature } = getChatModelConfig();
    const repository = getConversationRepository();
    const conversationId = repository.enabled
      ? await repository.createConversation()
      : null;

    if (conversationId) {
      await repository.storeMessage({
        conversationId,
        role: "user",
        content: query,
      });
    }

    const result = streamText({
      model,
      temperature,
      system: buildSystemPrompt({
        context: groundedContext.content,
        sources: groundedContext.sources,
      }),
      messages: await convertToModelMessages(
        parsedBody.messages as UIMessage[],
      ),
      onFinish: async ({ text }) => {
        if (!conversationId) return;
        try {
          await repository.storeMessage({
            conversationId,
            role: "assistant",
            content: text,
            sources: groundedContext.sources,
          });
        } catch (error) {
          console.error("Chat persistence failed", error);
        }
      },
    });

    return result.toUIMessageStreamResponse({
      onError(error) {
        console.error("OpenAI chat stream failed", error);
        return "Odpověď se nepodařilo dokončit. Zkuste to prosím znovu.";
      },
    });
  } catch (error) {
    console.error("Chat request failed", error);
    return publicError(
      "AI poradce teď není dostupný. Zkuste to prosím později.",
      503,
    );
  }
}
