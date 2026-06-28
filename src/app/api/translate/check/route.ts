import { NextRequest } from "next/server";
import { deepseek, DEEPSEEK_MODEL } from "@/lib/deepseek";
import { parseMistakes } from "@/lib/mistakeParser";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LANG_NAMES: Record<string, string> = {
  en: "English",
  fr: "French",
  es: "Spanish",
  it: "Italian",
  pt: "Portuguese",
  ro: "Romanian",
};

export async function POST(req: NextRequest) {
  let sourceText: string;
  let userTranslation: string;
  let sourceLang: string;

  let sessionId: string;
  let level: string;
  try {
    const body = await req.json();
    sourceText = body.sourceText;
    userTranslation = body.userTranslation;
    sourceLang = body.sourceLang ?? "en";
    sessionId = body.sessionId ?? "";
    level = body.level ?? "B1";
  } catch {
    return new Response("Invalid request body", { status: 400 });
  }

  if (!sourceText || !userTranslation) {
    return new Response("sourceText and userTranslation are required", { status: 400 });
  }

  const langName = LANG_NAMES[sourceLang] ?? "English";

  const system = `You are DeutschMeister, an expert German language teacher evaluating a translation exercise. All explanations and feedback are in English.`;

  const prompt = `The student was given this ${langName} text to translate into German:

"${sourceText}"

The student's German translation:
"${userTranslation}"

Evaluate the translation thoroughly. Use EXACTLY this format — do not deviate:

First, provide the ideal German translation:
---CORRECTED---
[Your ideal German translation of the original text]
---END---

Then for EACH mistake in the student's translation (identify specific words or phrases that are wrong, missing, or unnatural):
---CORRECTIONS---
❌ You said: "[exact phrase from the student's translation]"
✅ Correct: "[the correct German version of that phrase]"
📖 Why: [brief grammar or vocabulary explanation in English, max 2 sentences]
🔁 Repeat: "[the key German phrase the student should memorise]"
---END---

If there are no mistakes:
---CORRECTIONS---
✅ Keine Fehler! [one tip for making the translation sound even more natural]
---END---

Finally, an overall assessment:
---SCORE---
[2-3 sentences in English: what the student did well, what to practise next]
---END---`;

  let completion;
  try {
    completion = await deepseek.chat.completions.create({
      model: DEEPSEEK_MODEL,
      stream: true,
      messages: [
        { role: "system", content: system },
        { role: "user", content: prompt },
      ],
    });
  } catch (err) {
    console.error("DeepSeek translate check error:", err);
    return new Response(
      "⚠️ The teacher is unavailable right now. Please try again.",
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
        // Persist the attempt so the dashboard can track translation accuracy
        if (sessionId) {
          await prisma.translationAttempt.create({
            data: {
              sessionId,
              sourceLang,
              level,
              mistakeCount: parseMistakes(full).length,
            },
          });
        }
      } catch (err) {
        console.error("translate stream error:", err);
        controller.enqueue(
          encoder.encode("\n\n⚠️ Response interrupted. Please try again."),
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
