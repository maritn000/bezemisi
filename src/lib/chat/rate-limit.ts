import "server-only";

export type RateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
};

export interface ChatRateLimiter {
  check(key: string): Promise<RateLimitResult>;
}

type Entry = { count: number; resetAt: number };

class InMemoryRateLimiter implements ChatRateLimiter {
  private readonly entries = new Map<string, Entry>();

  constructor(
    private readonly limit = 12,
    private readonly windowMs = 60_000,
  ) {}

  async check(key: string): Promise<RateLimitResult> {
    const now = Date.now();
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

const developmentLimiter = new InMemoryRateLimiter();

/**
 * Replace this adapter with a durable distributed limiter before production
 * traffic. Per-instance memory cannot enforce a global serverless limit.
 */
export function getChatRateLimiter(): ChatRateLimiter {
  return developmentLimiter;
}

export function getRequestRateLimitKey(request: Request) {
  const realIp = request.headers.get("x-real-ip")?.trim();
  const forwardedIp = request.headers
    .get("x-forwarded-for")
    ?.split(",")[0]
    ?.trim();

  return realIp || forwardedIp || "anonymous";
}
