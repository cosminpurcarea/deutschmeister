import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { persistMistakes } from "@/lib/mistakeStore";
import type { ParsedMistake } from "@/lib/mistakeParser";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("sessionId");
  if (!sessionId) {
    return NextResponse.json({ mistakes: [], repetitionQueue: [] });
  }

  const [mistakes, repetitionQueue] = await Promise.all([
    prisma.mistake.findMany({
      where: { sessionId },
      orderBy: [{ count: "desc" }, { updatedAt: "desc" }],
    }),
    prisma.repetitionItem.findMany({
      where: { sessionId, mastered: false },
      orderBy: { drilledCount: "asc" },
    }),
  ]);

  return NextResponse.json({ mistakes, repetitionQueue });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const sessionId: string = body.sessionId;
  const mistakes: ParsedMistake[] = body.mistakes ?? [];

  if (!sessionId) {
    return NextResponse.json({ error: "sessionId required" }, { status: 400 });
  }

  await persistMistakes(sessionId, mistakes);
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const id: string = body.id;
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const updated = await prisma.mistake.update({
    where: { id },
    data: { count: { increment: 1 } },
  });

  return NextResponse.json({ mistake: updated });
}
