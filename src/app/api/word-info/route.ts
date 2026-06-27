import { NextRequest, NextResponse } from "next/server";
import { deepseek, DEEPSEEK_MODEL } from "@/lib/deepseek";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export interface WordInfo {
  translation: string;
  gender: string | null;   // "der" | "die" | "das" | null
  partOfSpeech: string;    // "noun" | "adjective" | "adverb" | "verb" | "other"
  examples: string[];
}

export async function POST(req: NextRequest) {
  const { word, context } = await req.json().catch(() => ({}));
  if (!word || typeof word !== "string") {
    return NextResponse.json({ error: "word required" }, { status: 400 });
  }

  const contextClause = context
    ? ` used in this sentence: "${String(context).slice(0, 300)}"`
    : "";

  const prompt = `You are a concise German-English dictionary. Analyse the German word "${word}"${contextClause}.

Return ONLY a JSON object with exactly these fields (no extra text):
{
  "translation": "<short English translation>",
  "gender": "<der | die | das | null — only for nouns, otherwise null>",
  "partOfSpeech": "<noun | adjective | adverb | verb | other>",
  "examples": ["<short German sentence using this word>", "<another example>"]
}`;

  try {
    const res = await deepseek.chat.completions.create({
      model: DEEPSEEK_MODEL,
      stream: false,
      temperature: 0.1,
      max_tokens: 300,
      response_format: { type: "json_object" },
      messages: [{ role: "user", content: prompt }],
    });

    const raw = res.choices[0]?.message?.content ?? "{}";
    const info: WordInfo = JSON.parse(raw);
    // ensure examples is always an array
    if (!Array.isArray(info.examples)) info.examples = [];
    return NextResponse.json(info);
  } catch (err) {
    console.error("word-info error:", err);
    return NextResponse.json(
      { translation: word, gender: null, partOfSpeech: "other", examples: [] } satisfies WordInfo,
    );
  }
}
