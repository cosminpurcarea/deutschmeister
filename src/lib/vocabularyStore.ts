import { prisma } from "@/lib/prisma";

export interface VocabEntry {
  id: string;
  sessionId: string;
  word: string;
  translation: string;
  gender: string | null;
  partOfSpeech: string;
  examples: string[];
  timesUsedByAI: number;
  mastered: boolean;
}

function parseExamples(raw: string): string[] {
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function toEntry(row: {
  id: string;
  sessionId: string;
  word: string;
  translation: string;
  gender: string | null;
  partOfSpeech: string;
  examples: string;
  timesUsedByAI: number;
  mastered: boolean;
}): VocabEntry {
  return { ...row, examples: parseExamples(row.examples) };
}

/** Add a word (upsert — safe to call if already exists). */
export async function addVocabWord(params: {
  sessionId: string;
  word: string;
  translation: string;
  gender?: string | null;
  partOfSpeech: string;
  examples: string[];
}): Promise<VocabEntry> {
  const examples = JSON.stringify(params.examples ?? []);
  const row = await prisma.vocabularyWord.upsert({
    where: { sessionId_word: { sessionId: params.sessionId, word: params.word } },
    update: { translation: params.translation, gender: params.gender ?? null, examples },
    create: {
      sessionId: params.sessionId,
      word: params.word,
      translation: params.translation,
      gender: params.gender ?? null,
      partOfSpeech: params.partOfSpeech,
      examples,
    },
  });
  return toEntry(row);
}

/** Active (non-mastered) words for a session. */
export async function activeVocabWords(sessionId: string): Promise<VocabEntry[]> {
  const rows = await prisma.vocabularyWord.findMany({
    where: { sessionId, mastered: false },
    orderBy: { createdAt: "asc" },
  });
  return rows.map(toEntry);
}

/** All words for a session (for the vocabulary page). */
export async function allVocabWords(sessionId: string): Promise<VocabEntry[]> {
  const rows = await prisma.vocabularyWord.findMany({
    where: { sessionId },
    orderBy: [{ mastered: "asc" }, { createdAt: "desc" }],
  });
  return rows.map(toEntry);
}

/** Mark a word as mastered. */
export async function markMastered(id: string): Promise<void> {
  await prisma.vocabularyWord.update({ where: { id }, data: { mastered: true } });
}

/** Remove a word from the list. */
export async function removeVocabWord(id: string): Promise<void> {
  await prisma.vocabularyWord.delete({ where: { id } });
}

/**
 * After each AI response, check which saved vocab words appear in the text
 * and increment their timesUsedByAI counter.
 */
export async function updateVocabUsage(
  sessionId: string,
  aiText: string,
): Promise<void> {
  const words = await prisma.vocabularyWord.findMany({
    where: { sessionId, mastered: false },
    select: { id: true, word: true },
  });
  const lower = aiText.toLowerCase();
  await Promise.all(
    words
      .filter((w) => lower.includes(w.word.toLowerCase()))
      .map((w) =>
        prisma.vocabularyWord.update({
          where: { id: w.id },
          data: { timesUsedByAI: { increment: 1 } },
        }),
      ),
  );
}
