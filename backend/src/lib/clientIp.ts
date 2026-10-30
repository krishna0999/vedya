// The real client IP, for rate limiting and submission meta. Render serves the
// API through Cloudflare, which sets CF-Connecting-IP itself and overwrites any
// client-sent value. X-Forwarded-For is NOT used: Render appends to it, so its
// left-most entry is client-controlled — spoofing it bypassed every rate limit.
// ponytail: falls back to the socket IP (local dev). If the API ever leaves
// Cloudflare, that's the proxy's IP — switch to a trustProxy hop count then.
import type { FastifyRequest } from 'fastify';

export function clientIp(req: FastifyRequest): string {
  const cf = req.headers['cf-connecting-ip'];
  return (Array.isArray(cf) ? cf[0] : cf) ?? req.ip;
}
