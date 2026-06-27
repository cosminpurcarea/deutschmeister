import { prisma } from "@/lib/prisma";

export interface StoredMessage {
  id: string;
  sessionId: string;
  role: string;
  content: string;
  createdAt: Date;
}

/** Persist one or more messages. Silently skips duplicates (idempotent). */
export async function saveMessages(
  sessionId: string,
  msgs: { id: string; role: string; content: string }[],
): Promise<void> {
  if (msgs.length === 0) return;
  for (const m of msgs) {
    await prisma.message.upsert({
      where: { id: m.id },
      update: {},
      create: { id: m.id, sessionId, role: m.role, content: m.content },
    });
  }
}

/** Load all messages for a session ordered oldest-first. */
export async function getMessages(sessionId: string): Promise<StoredMessage[]> {
  return prisma.message.findMany({
    where: { sessionId },
    orderBy: { createdAt: "asc" },
  });
}
