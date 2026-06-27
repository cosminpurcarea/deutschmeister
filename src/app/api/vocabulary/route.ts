import { NextRequest, NextResponse } from "next/server";
import {
  addVocabWord,
  allVocabWords,
  markMastered,
  removeVocabWord,
} from "@/lib/vocabularyStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("sessionId") ?? "";
  const words = await allVocabWords(sessionId);
  return NextResponse.json({ words });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { sessionId, word, translation, gender, partOfSpeech, examples } = body;
  if (!sessionId || !word) {
    return NextResponse.json({ error: "sessionId and word required" }, { status: 400 });
  }
  const entry = await addVocabWord({
    sessionId,
    word,
    translation: translation ?? word,
    gender: gender ?? null,
    partOfSpeech: partOfSpeech ?? "noun",
    examples: examples ?? [],
  });
  return NextResponse.json({ word: entry });
}

export async function PATCH(req: NextRequest) {
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await markMastered(id);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await removeVocabWord(id);
  return NextResponse.json({ ok: true });
}
