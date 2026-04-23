/**
 * lib/gemini.ts
 *
 * Resilient Gemini text generation with:
 *   - Exponential-backoff retry on 503 / rate-limit errors
 *   - Automatic fallback from gemini-2.5-flash → gemini-1.5-flash
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");

// Models tried in order when the primary is overloaded
const MODEL_CHAIN = ["gemini-2.5-flash", "gemini-1.5-flash"] as const;

// Errors that are worth retrying (transient)
const RETRYABLE = /503|429|rate.?limit|quota|overload|unavailable/i;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Generate text from Gemini with automatic retry + model fallback.
 *
 * @param prompt  The prompt to send.
 * @param maxRetries  Per-model retry attempts (default 3).
 * @param baseDelayMs  Initial backoff delay in ms (doubles each attempt).
 */
export async function generateText(
  prompt: string,
  maxRetries = 3,
  baseDelayMs = 1500
): Promise<string> {
  let lastError: unknown;

  for (const modelName of MODEL_CHAIN) {
    const model = genAI.getGenerativeModel({ model: modelName });

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await model.generateContent(prompt);
        return result.response.text();
      } catch (err: unknown) {
        lastError = err;
        const msg = err instanceof Error ? err.message : String(err);

        if (!RETRYABLE.test(msg)) {
          // Non-transient error (bad prompt, auth, etc.) – don't retry
          throw err;
        }

        if (attempt < maxRetries) {
          const delay = baseDelayMs * 2 ** (attempt - 1);
          console.warn(
            `[gemini] ${modelName} attempt ${attempt}/${maxRetries} failed (${msg.slice(0, 80)}). Retrying in ${delay}ms…`
          );
          await sleep(delay);
        } else {
          console.warn(
            `[gemini] ${modelName} exhausted ${maxRetries} attempts. Trying next model…`
          );
        }
      }
    }
  }

  // All models exhausted
  throw lastError;
}
