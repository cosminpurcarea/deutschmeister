import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseMistakes } from "@/lib/mistakeParser";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ── Helpers ───────────────────────────────────────────────────────────────────

/** "YYYY-MM-DD" in local time for a Date object */
function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Last 7 calendar days including today, as "YYYY-MM-DD" strings */
function last7Days(): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return toDateStr(d);
  });
}

function groupCount(dates: Date[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const d of dates) {
    const k = toDateStr(d);
    out[k] = (out[k] ?? 0) + 1;
  }
  return out;
}

// ── Route ─────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("sessionId") ?? "";
  const days = last7Days();
  const since = new Date();
  since.setDate(since.getDate() - 6);
  since.setHours(0, 0, 0, 0);

  // Fetch everything in parallel
  const [vocabAll, messagesRecent, translationsRecent] = await Promise.all([
    prisma.vocabularyWord.findMany({
      where: { sessionId },
      select: { mastered: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    // All messages in last 7 days (user + assistant)
    prisma.message.findMany({
      where: { sessionId, createdAt: { gte: since } },
      select: { role: true, content: true, createdAt: true },
    }),
    prisma.translationAttempt.findMany({
      where: { sessionId, createdAt: { gte: since } },
      select: { createdAt: true, mistakeCount: true },
    }),
  ]);

  // ── Vocabulary ─────────────────────────────────────────────────────────────
  const vocabActive = vocabAll.filter((v) => !v.mastered).length;
  const vocabMastered = vocabAll.filter((v) => v.mastered).length;

  // New words added per day (bar chart)
  const vocabAddedByDay = groupCount(vocabAll.map((v) => v.createdAt));

  // Cumulative total as of each day (line chart)
  const vocabChart = days.map((d) => {
    const dayEnd = new Date(d + "T23:59:59.999");
    const total = vocabAll.filter((v) => v.createdAt <= dayEnd).length;
    return { date: d, total, added: vocabAddedByDay[d] ?? 0 };
  });

  // ── Chat accuracy ──────────────────────────────────────────────────────────
  // For each assistant message, parse corrections to determine if it was error-free
  const assistantMsgs = messagesRecent.filter((m) => m.role === "assistant");
  const userMsgs = messagesRecent.filter((m) => m.role === "user");

  const userByDay = groupCount(userMsgs.map((m) => m.createdAt));

  // Count assistant messages with NO mistakes per day
  const noMistakeByDay: Record<string, number> = {};
  const hasMistakeByDay: Record<string, number> = {};
  for (const msg of assistantMsgs) {
    const k = toDateStr(msg.createdAt);
    const mistakes = parseMistakes(msg.content);
    const hasCorrectionsBlock = msg.content.includes("---CORRECTIONS---");
    if (hasCorrectionsBlock) {
      if (mistakes.length === 0) {
        noMistakeByDay[k] = (noMistakeByDay[k] ?? 0) + 1;
      } else {
        hasMistakeByDay[k] = (hasMistakeByDay[k] ?? 0) + 1;
      }
    }
  }

  const chatChart = days.map((d) => {
    const perfect = noMistakeByDay[d] ?? 0;
    const withMistake = hasMistakeByDay[d] ?? 0;
    const total = perfect + withMistake;
    const accuracy = total > 0 ? Math.round((perfect / total) * 100) : null;
    return { date: d, messages: userByDay[d] ?? 0, accuracy };
  });

  // Weekly chat accuracy (average of days that have data)
  const chatDaysWithData = chatChart.filter((d) => d.accuracy !== null);
  const weeklyChat =
    chatDaysWithData.length > 0
      ? Math.round(
          chatDaysWithData.reduce((s, d) => s + d.accuracy!, 0) /
            chatDaysWithData.length,
        )
      : null;

  // ── Translation accuracy ───────────────────────────────────────────────────
  const transByDay: Record<string, { total: number; perfect: number }> = {};
  for (const t of translationsRecent) {
    const k = toDateStr(t.createdAt);
    if (!transByDay[k]) transByDay[k] = { total: 0, perfect: 0 };
    transByDay[k].total++;
    if (t.mistakeCount === 0) transByDay[k].perfect++;
  }

  const translationChart = days.map((d) => {
    const { total = 0, perfect = 0 } = transByDay[d] ?? {};
    const accuracy = total > 0 ? Math.round((perfect / total) * 100) : null;
    return { date: d, attempts: total, accuracy };
  });

  const transWeek = translationsRecent.length > 0
    ? Math.round(
        (translationsRecent.filter((t) => t.mistakeCount === 0).length /
          translationsRecent.length) *
          100,
      )
    : null;

  // ── Totals ─────────────────────────────────────────────────────────────────
  const [totalSessions, totalMessages, totalMistakes, totalTranslations] =
    await Promise.all([
      prisma.session.count({ where: { id: sessionId } }),
      prisma.message.count({ where: { sessionId } }),
      prisma.mistake.count({ where: { sessionId } }),
      prisma.translationAttempt.count({ where: { sessionId } }),
    ]);

  return NextResponse.json({
    vocab: {
      total: vocabAll.length,
      active: vocabActive,
      mastered: vocabMastered,
      chart: vocabChart,
    },
    chat: {
      weeklyAccuracy: weeklyChat,
      chart: chatChart,
    },
    translation: {
      total: totalTranslations,
      weeklyAccuracy: transWeek,
      chart: translationChart,
    },
    totals: {
      sessions: totalSessions,
      messages: totalMessages,
      mistakes: totalMistakes,
    },
  });
}
