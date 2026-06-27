import { prisma } from "@/lib/prisma";
import type { ParsedMistake } from "@/lib/mistakeParser";

export async function ensureSession(sessionId: string, title?: string) {
  await prisma.session.upsert({
    where: { id: sessionId },
    update: {},
    create: { id: sessionId, title: title ?? "New conversation" },
  });
}

/**
 * Persists parsed mistakes for a session. Repeated mistakes (matched on the
 * `wrong` text) increment their count; once count >= 2 they enter the
 * RepetitionQueue so the teacher drills them again.
 */
export async function persistMistakes(
  sessionId: string,
  parsed: ParsedMistake[],
) {
  await ensureSession(sessionId);

  for (const m of parsed) {
    if (!m.wrong && !m.correct) continue;

    const existing = await prisma.mistake.findFirst({
      where: { sessionId, wrong: m.wrong },
    });

    const saved = existing
      ? await prisma.mistake.update({
          where: { id: existing.id },
          data: {
            count: { increment: 1 },
            correct: m.correct,
            explanation: m.explanation,
            repeatPhrase: m.repeatPhrase,
          },
        })
      : await prisma.mistake.create({
          data: {
            sessionId,
            wrong: m.wrong,
            correct: m.correct,
            explanation: m.explanation,
            repeatPhrase: m.repeatPhrase,
          },
        });

    if (saved.count >= 2) {
      const queued = await prisma.repetitionItem.findFirst({
        where: { sessionId, mistakeId: saved.id },
      });
      if (!queued) {
        await prisma.repetitionItem.create({
          data: {
            sessionId,
            mistakeId: saved.id,
            phrase: saved.repeatPhrase || saved.correct,
          },
        });
      }
    }
  }
}

/** Returns up to 3 weakest unmastered phrases to inject into the system prompt. */
export async function topRepetitionPhrases(sessionId: string): Promise<string[]> {
  const items = await prisma.repetitionItem.findMany({
    where: { sessionId, mastered: false },
    orderBy: { drilledCount: "asc" },
    take: 3,
  });
  return items.map((i) => i.phrase);
}
