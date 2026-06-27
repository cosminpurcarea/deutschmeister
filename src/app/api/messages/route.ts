import { NextRequest, NextResponse } from "next/server";
import { getMessages, saveMessages } from "@/lib/messageStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("sessionId") ?? "";
  const messages = await getMessages(sessionId);
  return NextResponse.json({ messages });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { sessionId, messages } = body;
  if (!sessionId || !Array.isArray(messages)) {
    return NextResponse.json({ error: "sessionId and messages required" }, { status: 400 });
  }
  await saveMessages(sessionId, messages);
  return NextResponse.json({ ok: true });
}
