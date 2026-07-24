import { handleChatRequest } from "@/lib/chat/chat-service";
import { CHAT_ERRORS } from "@/lib/chat/errors";
import {
  getChatRateLimiter,
  getRequestRateLimitKey,
} from "@/lib/chat/rate-limit";
import { chatRequestSchema, type ChatRequest } from "@/lib/chat/validation";

export const runtime = "nodejs";
export const maxDuration = 30;

function publicError(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

export async function POST(request: Request) {
  const rateLimit = await getChatRateLimiter().check(
    getRequestRateLimitKey(request),
  );
  if (!rateLimit.allowed) {
    return new Response(
      JSON.stringify({
        error: CHAT_ERRORS.rateLimit,
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
  } catch (error) {
    console.error("Chat payload validation failed", error);
    return publicError(CHAT_ERRORS.invalidRequest, 400);
  }

  try {
    return await handleChatRequest(parsedBody);
  } catch (error) {
    console.error("Chat request failed", error);
    return publicError(CHAT_ERRORS.general, 503);
  }
}
