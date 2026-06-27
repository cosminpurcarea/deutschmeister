"use client";

import { useEffect, useRef, useState } from "react";
import { getSessionId } from "@/lib/sessionId";
import { parseMistakes } from "@/lib/mistakeParser";
import MessageBubble from "./MessageBubble";
import CorrectionBlock from "./CorrectionBlock";
import ScenarioCard, { Scenario } from "./ScenarioCard";
import InputBar from "./InputBar";
import GermanText from "./GermanText";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const GREETING =
  "Hallo! Ich bin DeutschMeister, dein persönlicher Deutschlehrer. " +
  "Worüber möchtest du heute sprechen? Schreib einfach auf Deutsch — ich korrigiere dich danach. 🙂";

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

function AssistantMessage({
  content,
  sessionId,
}: {
  content: string;
  sessionId: string;
}) {
  const parsed = parseAssistant(content);
  return (
    <div className="space-y-2">
      {parsed.german && (
        <MessageBubble role="assistant">
          <GermanText text={parsed.german} sessionId={sessionId} />
        </MessageBubble>
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

export default function ChatWindow() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevStreamingRef = useRef(false);

  // Load session and history on mount
  useEffect(() => {
    const sid = getSessionId();
    setSessionId(sid);
    fetch(`/api/messages?sessionId=${encodeURIComponent(sid)}`)
      .then((r) => r.json())
      .then((data) => {
        const saved: Message[] = (data.messages ?? []).map(
          (m: { id: string; role: string; content: string }) => ({
            id: m.id,
            role: m.role as "user" | "assistant",
            content: m.content,
          }),
        );
        setMessages(
          saved.length > 0
            ? saved
            : [{ id: "greeting", role: "assistant", content: GREETING }],
        );
      })
      .catch(() =>
        setMessages([{ id: "greeting", role: "assistant", content: GREETING }]),
      )
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const wasStreaming = prevStreamingRef.current;
    prevStreamingRef.current = streaming;

    if (streaming) {
      // While streaming, keep scrolling to bottom so the user sees incoming text
      container.scrollTo({ top: container.scrollHeight });
    } else if (wasStreaming) {
      // Streaming just finished — scroll so the START of the last AI message is
      // visible (not the bottom of the correction blocks which pushes it off-screen)
      const children = Array.from(container.children);
      const last = children[children.length - 1] as HTMLElement | undefined;
      if (last) {
        const containerTop = container.getBoundingClientRect().top;
        const lastTop = last.getBoundingClientRect().top;
        container.scrollTo({
          top: container.scrollTop + (lastTop - containerTop) - 16,
          behavior: "smooth",
        });
      }
    } else {
      // Initial load or any non-streaming change → show start of last message
      // so German text (top of AssistantMessage) is visible, not correction blocks
      const children = Array.from(container.children);
      const last = children[children.length - 1] as HTMLElement | undefined;
      if (last) {
        const containerTop = container.getBoundingClientRect().top;
        const lastTop = last.getBoundingClientRect().top;
        container.scrollTo({
          top: container.scrollTop + (lastTop - containerTop) - 16,
        });
      } else {
        container.scrollTo({ top: container.scrollHeight });
      }
    }
  }, [messages, streaming]);

  async function send() {
    const text = input.trim();
    if (!text || streaming) return;

    setError(null);
    const sid = sessionId || getSessionId();
    const userMessageId = `u-${Date.now()}`;
    const assistantMessageId = `a-${Date.now()}`;

    const userMsg: Message = { id: userMessageId, role: "user", content: text };
    const history = [...messages.filter((m) => m.id !== "greeting"), userMsg];
    setMessages([...history, { id: assistantMessageId, role: "assistant", content: "" }]);
    setInput("");
    setStreaming(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: sid,
          userMessageId,
          assistantMessageId,
          messages: history.map(({ role, content }) => ({ role, content })),
        }),
      });

      if (!res.ok || !res.body) throw new Error(`Chat failed (${res.status})`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantMessageId ? { ...m, content: acc } : m)),
        );
      }
    } catch (err) {
      console.error(err);
      setError("Could not reach the teacher. Please try again.");
      setMessages((prev) => prev.filter((m) => m.id !== assistantMessageId));
    } finally {
      setStreaming(false);
    }
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-57px)] max-w-3xl flex-col">
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4">
        {loading ? (
          <p className="text-xs text-fiori-muted">Loading conversation…</p>
        ) : (
          messages.map((m) =>
            m.role === "user" ? (
              <MessageBubble key={m.id} role="user">
                {m.content}
              </MessageBubble>
            ) : (
              <AssistantMessage
                key={m.id}
                content={m.content}
                sessionId={sessionId}
              />
            ),
          )
        )}
        {streaming && (
          <p className="px-1 text-xs text-fiori-muted">DeutschMeister schreibt…</p>
        )}
      </div>

      {error && (
        <p className="px-4 py-1 text-xs text-fiori-error" role="alert">
          {error}
        </p>
      )}

      <InputBar
        value={input}
        onChange={setInput}
        onSend={send}
        disabled={streaming || loading}
      />
    </div>
  );
}
