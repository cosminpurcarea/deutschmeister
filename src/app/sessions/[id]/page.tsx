"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import MessageBubble from "@/components/chat/MessageBubble";
import CorrectionBlock from "@/components/chat/CorrectionBlock";
import ScenarioCard, { Scenario } from "@/components/chat/ScenarioCard";
import { parseMistakes } from "@/lib/mistakeParser";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface SessionInfo {
  id: string;
  title: string;
  createdAt: string;
  messageCount: number;
  mistakeCount: number;
}

function valueAfterColon(line: string): string {
  const idx = line.indexOf(":");
  return (idx >= 0 ? line.slice(idx + 1) : line).trim();
}

function parseScenarios(content: string): Scenario[] {
  const blocks = Array.from(
    content.matchAll(/---SCENARIO---([\s\S]*?)---END---/g),
  );
  const scenarios: Scenario[] = [];
  for (const block of blocks) {
    const s: Scenario = {};
    for (const line of block[1].split("\n")) {
      const t = line.trim();
      if (t.startsWith("🎭")) s.situation = valueAfterColon(t);
      else if (t.startsWith("👤")) s.yourRole = valueAfterColon(t);
      else if (t.startsWith("🤖")) s.myRole = valueAfterColon(t);
      else if (t.startsWith("▶️")) s.opener = t.replace(/^▶️\s*/, "").trim();
    }
    scenarios.push(s);
  }
  return scenarios;
}

function parseAssistant(content: string) {
  const scenarios = parseScenarios(content);
  const mistakes = parseMistakes(content);

  const correctionMatch = content.match(/---CORRECTIONS---([\s\S]*?)---END---/);
  const hasCorrections = Boolean(correctionMatch);
  const noMistakes = hasCorrections && /keine fehler/i.test(correctionMatch![1]);
  const noteMatch = correctionMatch?.[1].match(/keine fehler!?\s*(.*)/i);
  const note = noteMatch?.[1]?.trim() || undefined;

  const german = content
    .replace(/---SCENARIO---[\s\S]*?---END---/g, "")
    .replace(/---CORRECTIONS---[\s\S]*?---END---/g, "")
    .trim();

  return { german, scenarios, mistakes, hasCorrections, noMistakes, note };
}

function AssistantMessage({ content }: { content: string }) {
  const parsed = parseAssistant(content);
  return (
    <div className="space-y-2">
      {parsed.german && (
        <MessageBubble role="assistant">{parsed.german}</MessageBubble>
      )}
      {parsed.scenarios.map((s, i) => (
        <ScenarioCard key={i} scenario={s} />
      ))}
      {parsed.mistakes.map((mk, i) => (
        <CorrectionBlock key={i} mistake={mk} />
      ))}
      {parsed.hasCorrections && parsed.noMistakes && (
        <CorrectionBlock note={parsed.note} />
      )}
    </div>
  );
}

export default function SessionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      fetch(`/api/sessions/${id}`).then((r) => {
        if (r.status === 404) { setNotFound(true); return null; }
        return r.json();
      }),
      fetch(`/api/messages?sessionId=${encodeURIComponent(id)}`).then((r) =>
        r.json(),
      ),
    ])
      .then(([sessionData, messagesData]) => {
        if (sessionData) setSession(sessionData);
        setMessages(
          (messagesData?.messages ?? []).map(
            (m: { id: string; role: string; content: string }) => ({
              id: m.id,
              role: m.role as "user" | "assistant",
              content: m.content,
            }),
          ),
        );
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="p-6 text-sm text-fiori-muted">Loading session…</div>
    );
  }

  if (notFound || !session) {
    return (
      <div className="p-6">
        <p className="text-sm text-fiori-error">Session not found.</p>
        <Link href="/sessions" className="mt-2 text-sm text-fiori-blue hover:underline">
          ← Back to sessions
        </Link>
      </div>
    );
  }

  const date = new Date(session.createdAt).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="mx-auto max-w-3xl p-6">
      <Link
        href="/sessions"
        className="mb-4 inline-block text-sm text-fiori-blue hover:underline"
      >
        ← Back to sessions
      </Link>

      <h1 className="mb-1 text-2xl font-semibold text-fiori-text">
        {session.title}
      </h1>
      <p className="mb-6 text-xs text-fiori-muted">
        {date} · {session.messageCount} messages · {session.mistakeCount}{" "}
        mistakes
      </p>

      <div className="space-y-4">
        {messages.length === 0 && (
          <p className="text-sm text-fiori-muted">No messages in this session.</p>
        )}
        {messages.map((m) =>
          m.role === "user" ? (
            <MessageBubble key={m.id} role="user">
              {m.content}
            </MessageBubble>
          ) : (
            <AssistantMessage key={m.id} content={m.content} />
          ),
        )}
      </div>
    </div>
  );
}
