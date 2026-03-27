import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW_MS = 60_000;

// Upstash Redis varsa kullan, yoksa in-memory fallback (local dev için)
let ratelimit: Ratelimit | null = null;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
  ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(RATE_LIMIT_MAX, "60 s"),
    prefix: "demo-request",
  });
}

// In-memory fallback (single-instance / dev ortamı)
const inMemoryMap = new Map<string, { count: number; lastReset: number }>();

function inMemoryCheck(ip: string): boolean {
  const now = Date.now();
  const info = inMemoryMap.get(ip) ?? { count: 0, lastReset: now };
  if (now - info.lastReset > RATE_LIMIT_WINDOW_MS) {
    info.count = 0;
    info.lastReset = now;
  }
  if (info.count >= RATE_LIMIT_MAX) return false;
  info.count += 1;
  inMemoryMap.set(ip, info);
  return true;
}

/**
 * IP başına rate limit kontrolü.
 * @returns true → istek geçebilir, false → 429 dönülmeli
 */
export async function checkRateLimit(ip: string): Promise<boolean> {
  if (ratelimit) {
    const { success } = await ratelimit.limit(ip);
    return success;
  }
  return inMemoryCheck(ip);
}
