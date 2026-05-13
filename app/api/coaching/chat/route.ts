import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-utils";
import { getGroqClient, MODELS } from "@/lib/groq";

const SYSTEM_PROMPTS = {
  coach: `You are Buzz, a warm and expert AI career coach specialized in remote work and tech careers.
You help job seekers with: interview preparation, career strategy, salary negotiation, job search tactics,
offer decisions, skill development, and navigating career transitions.
You have deep knowledge of the remote work landscape and async-first company cultures.
Be concise, actionable, and encouraging. Use bullet points when giving lists of advice.
If someone asks about a specific company or role, give your honest assessment.`,

  networking: `You are Nate, an expert AI networking strategist specialized in tech and remote work industries.
You help people build authentic professional connections, craft compelling outreach messages,
design networking strategies for job searches, and leverage platforms like LinkedIn, Twitter/X, and GitHub.
You know the difference between spam and genuine networking, and you teach people to build real relationships.
Be specific and give copy-paste-ready message templates when appropriate.
Keep advice practical and respect the other person's time and boundaries.`,
};

type Mode = "coach" | "networking";

interface HistoryMessage {
  role: "user" | "assistant";
  content: string;
}

export async function POST(request: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;

  // Silence unused variable warning — auth is the gate
  void user;

  const { message, mode, history } = (await request.json()) as {
    message: string;
    mode: Mode;
    history: HistoryMessage[];
  };

  if (!message?.trim()) {
    return new Response(JSON.stringify({ error: "Message is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const resolvedMode: Mode = mode === "networking" ? "networking" : "coach";
  const systemPrompt = SYSTEM_PROMPTS[resolvedMode];

  // Cap history to the last 10 messages to avoid token bloat
  const trimmedHistory = (history ?? []).slice(-10);

  const messages = [
    { role: "system" as const, content: systemPrompt },
    ...trimmedHistory.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user" as const, content: message },
  ];

  const stream = await getGroqClient().chat.completions.create({
    stream: true,
    model: MODELS.powerful,
    messages,
    temperature: 0.7,
    max_tokens: 1024,
  });

  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content ?? "";
          if (text) {
            controller.enqueue(encoder.encode(text));
          }
        }
      } catch (err) {
        console.error("Streaming error:", err);
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
