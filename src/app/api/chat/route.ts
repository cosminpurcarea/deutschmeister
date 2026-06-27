import { NextRequest } from "next/server";
import { deepseek, DEEPSEEK_MODEL } from "@/lib/deepseek";
import { buildSystemPrompt } from "@/lib/prompts";
import { parseMistakes } from "@/lib/mistakeParser";
import {
  ensureSession,
  persistMistakes,
  topRepetitionPhrases,
} from "@/lib/mistakeStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export async function POST(req: NextRequest) {
  let sessionId: string;
  let messages: ChatMessage[];
  try {
    const body = await req.json();
    sessionId = body.sessionId;
    messages = body.messages;
  } catch {
    return new Response("Invalid request body", { status: 400 });
  }

  if (!sessionId || !Array.isArray(messages)) {
    return new Response("sessionId and messages are required", { status: 400 });
  }

  await ensureSession(sessionId);
  const phrases = await topRepetitionPhrases(sessionId);
  const system = buildSystemPrompt(phrases);

  let completion;
  try {
    completion = await deepseek.chat.completions.create({
      model: DEEPSEEK_MODEL,
      stream: true,
      messages: [
        { role: "system", content: system },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
    });
  } catch (err) {
    console.error("DeepSeek request failed:", err);
    return new Response(
      "⚠️ The teacher is unavailable right now. Please try again in a moment.",
      { status: 502, headers: { "Content-Type": "text/plain; charset=utf-8" } },
    );
  }

  const encoder = new TextEncoder();
  let full = "";

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of completion) {
          const delta = chunk.choices?.[0]?.delta?.content ?? "";
          if (delta) {
            full += delta;
            controller.enqueue(encoder.encode(delta));
          }
        }
        await persistMistakes(sessionId, parseMistakes(full));
      } catch (err) {
        console.error("DeepSeek stream error:", err);
        controller.enqueue(
          encoder.encode(
            "\n\n⚠️ Sorry, the response was interrupted. Please try again.",
          ),
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
    },
  });
}
