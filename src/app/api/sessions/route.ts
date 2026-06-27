import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const sessions = await prisma.session.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { messages: true, mistakes: true } },
    },
  });

  return NextResponse.json({
    sessions: sessions.map((s) => ({
      id: s.id,
      title: s.title,
      createdAt: s.createdAt,
      messageCount: s._count.messages,
      mistakeCount: s._count.mistakes,
    })),
  });
}
