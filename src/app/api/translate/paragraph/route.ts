import { NextRequest, NextResponse } from "next/server";
import { deepseek, DEEPSEEK_MODEL } from "@/lib/deepseek";

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

const LEVEL_DESC: Record<string, string> = {
  A1: "very simple with basic everyday vocabulary, very short sentences (2-3 sentences total)",
  A2: "simple with everyday topics and basic grammar (3-4 sentences total)",
  B1: "intermediate with varied topics and some complex sentences (4-5 sentences total)",
  B2: "upper-intermediate with nuanced language and complex grammar (4-5 sentences total)",
  C1: "advanced with sophisticated vocabulary and complex structures (4-5 sentences total)",
};

const TOPICS = [
  "daily life and routines",
  "travel and tourism",
  "work and career",
  "food and cooking",
  "technology and social media",
  "nature and the environment",
  "health and fitness",
  "arts and culture",
  "sports and leisure",
  "education and learning",
  "city life and transport",
  "weather and seasons",
];

export async function GET(req: NextRequest) {
  const lang = req.nextUrl.searchParams.get("lang") ?? "en";
  const level = req.nextUrl.searchParams.get("level") ?? "B1";

  const langName = LANG_NAMES[lang] ?? "English";
  const levelDesc = LEVEL_DESC[level] ?? LEVEL_DESC.B1;
  const topic = TOPICS[Math.floor(Math.random() * TOPICS.length)];

  const prompt = `Write a ${levelDesc} paragraph in ${langName} about the topic: "${topic}".
The text is for a German language learner who will translate it into German.

Return ONLY the paragraph text — no title, no instructions, no labels, no extra commentary. Just the paragraph itself.`;

  try {
    const res = await deepseek.chat.completions.create({
      model: DEEPSEEK_MODEL,
      stream: false,
      temperature: 0.9,
      max_tokens: 300,
      messages: [{ role: "user", content: prompt }],
    });

    const text = res.choices[0]?.message?.content?.trim() ?? "";
    return NextResponse.json({ text, lang, level, topic });
  } catch (err) {
    console.error("paragraph generation error:", err);
    return NextResponse.json(
      { error: "Failed to generate paragraph" },
      { status: 502 },
    );
  }
}
