import "server-only";

import { createHash } from "node:crypto";

export type RateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
};

export interface ChatRateLimiter {
  check(key: string): Promise<RateLimitResult>;
}

type Entry = { count: number; resetAt: number };

class WindowLimiter {
  private readonly entries = new Map<string, Entry>();

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
  ) {}

  check(key: string, now: number): RateLimitResult {
    const entry = this.entries.get(key);

    if (!entry || entry.resetAt <= now) {
      this.entries.set(key, { count: 1, resetAt: now + this.windowMs });
      return { allowed: true, retryAfterSeconds: 0 };
    }

    if (entry.count >= this.limit) {
      return {
        allowed: false,
        retryAfterSeconds: Math.max(
          1,
          Math.ceil((entry.resetAt - now) / 1000),
        ),
      };
    }

    entry.count += 1;
    return { allowed: true, retryAfterSeconds: 0 };
  }
}

/**
 * DEVELOPMENT FALLBACK — not reliable across multiple serverless instances.
 * Replace with durable shared storage before production traffic.
 */
class InMemoryDualWindowRateLimiter implements ChatRateLimiter {
  private readonly perMinute = new WindowLimiter(12, 60_000);
  private readonly perDay = new WindowLimiter(120, 86_400_000);

  async check(key: string): Promise<RateLimitResult> {
    const now = Date.now();
    const minute = this.perMinute.check(key, now);
    if (!minute.allowed) return minute;
    return this.perDay.check(key, now);
  }
}

const developmentLimiter = new InMemoryDualWindowRateLimiter();

export function getChatRateLimiter(): ChatRateLimiter {
  return developmentLimiter;
}

function hashIdentifier(value: string) {
  return createHash("sha256").update(value).digest("hex").slice(0, 32);
}

/**
 * Privacy-conscious key: never store the raw IP; only a short hash.
 */
export function getRequestRateLimitKey(request: Request) {
  const realIp = request.headers.get("x-real-ip")?.trim();
  const forwardedIp = request.headers
    .get("x-forwarded-for")
    ?.split(",")[0]
    ?.trim();
  const raw = realIp || forwardedIp || "anonymous";
  return `chat:${hashIdentifier(raw)}`;
}
