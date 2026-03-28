import Groq from "groq-sdk";

// Multiple Groq API keys for rotation (load balancing & rate limit avoidance)
const GROQ_KEYS = [
  process.env.GROQ_API_KEY_1,
  process.env.GROQ_API_KEY_2,
  process.env.GROQ_API_KEY_3,
  process.env.GROQ_API_KEY_4,
  process.env.GROQ_API_KEY_5,
  process.env.GROQ_API_KEY_6,
  process.env.GROQ_API_KEY_7,
  process.env.GROQ_API_KEY, // fallback single key
].filter(Boolean) as string[];

let keyIndex = 0;

function getNextKey(): string {
  if (GROQ_KEYS.length === 0) {
    throw new Error("No Groq API keys configured");
  }
  const key = GROQ_KEYS[keyIndex % GROQ_KEYS.length];
  keyIndex++;
  return key;
}

/**
 * Get a Groq client with round-robin key rotation.
 * Each call returns a client with the next API key in the pool.
 */
export function getGroqClient(): Groq {
  return new Groq({ apiKey: getNextKey() });
}

// Default client (uses first available key)
export const groq = new Proxy({} as Groq, {
  get(_, prop) {
    return (getGroqClient() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export const MODELS = {
  fast: "llama-3.1-8b-instant",
  powerful: "llama-3.3-70b-versatile",
} as const;
