// Environment config, validated once at boot. Fail fast and loud if a required
// variable is missing rather than blowing up mid-request.
import "dotenv/config";
import { z } from "zod";

const EnvSchema = z.object({
  DATABASE_URL: z
    .string()
    .min(1, "DATABASE_URL is required (see .env.example)"),
  PORT: z.coerce.number().int().positive().default(8787),
  // Comma-separated allowlist of browser origins for CORS.
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  // OpenAI key for AI form generation (ROADMAP Phase 1). Defaults to a dummy so
  // the server boots without it; the AI route returns 503 until a real key is set.
  OPENAI_API_KEY: z.string().default("sk-dummy-set-me"),
  OPENAI_MODEL: z.string().default("gpt-4o-mini"),
  // Cloudflare Turnstile secret for the public submit bot check. Unset = the
  // check is skipped (local dev); set it in production.
  TURNSTILE_SECRET_KEY: z.string().optional(),
  // Resend API key for transactional email. Unset = emails are logged (dev).
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default("Vedya <no-reply@vedya.app>"),
});

const parsed = EnvSchema.safeParse(process.env);
if (!parsed.success) {
  const issues = parsed.error.issues
    .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
    .join("\n");
  throw new Error(`Invalid environment:\n${issues}`);
}

export const env = {
  ...parsed.data,
  corsOrigins: parsed.data.CORS_ORIGIN.split(",")
    .map((s) => s.trim())
    .filter(Boolean),
  // Where emailed links point: the frontend, i.e. the first allowed origin.
  appUrl: parsed.data.CORS_ORIGIN.split(",")[0]!.trim(),
  // True once a real key replaces the dummy placeholder.
  openaiConfigured:
    parsed.data.OPENAI_API_KEY.length > 0 &&
    parsed.data.OPENAI_API_KEY !== "sk-dummy-set-me",
};
