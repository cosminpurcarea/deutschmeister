import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await prisma.session.findUnique({
    where: { id: params.id },
    include: {
      _count: { select: { messages: true, mistakes: true } },
    },
  });

  if (!session) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: session.id,
    title: session.title,
    createdAt: session.createdAt,
    messageCount: session._count.messages,
    mistakeCount: session._count.mistakes,
  });
}
