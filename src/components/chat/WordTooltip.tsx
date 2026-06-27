"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import ReactDOM from "react-dom";
import type { WordInfo } from "@/app/api/word-info/route";

// Module-level in-memory cache so re-hovering the same word is instant.
const wordInfoCache = new Map<string, WordInfo | "loading" | "error">();

const GENDER_COLOUR: Record<string, string> = {
  der: "text-fiori-blue",
  die: "text-fiori-error",
  das: "text-fiori-success",
};

const VOCAB_POS = new Set(["noun", "adjective", "adverb"]);

interface Props {
  word: string;
  context: string;
  sessionId: string;
}

export default function WordTooltip({ word, context, sessionId }: Props) {
  const spanRef = useRef<HTMLSpanElement>(null);
  const [visible, setVisible] = useState(false);
  const [info, setInfo] = useState<WordInfo | null>(null);
  const [added, setAdded] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0, above: true });
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearHide = () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
  };
  const scheduleHide = () => {
    clearHide();
    hideTimer.current = setTimeout(() => setVisible(false), 200);
  };

  const fetchInfo = useCallback(async () => {
    const cached = wordInfoCache.get(word);
    if (cached && cached !== "loading" && cached !== "error") {
      setInfo(cached);
      return;
    }
    if (cached === "loading") return;
    wordInfoCache.set(word, "loading");
    try {
      const res = await fetch("/api/word-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word, context }),
      });
      const data: WordInfo = await res.json();
      wordInfoCache.set(word, data);
      setInfo(data);
    } catch {
      wordInfoCache.set(word, "error");
    }
  }, [word, context]);

  function handleWordEnter() {
    clearHide();
    const rect = spanRef.current?.getBoundingClientRect();
    if (rect) {
      const above = rect.top > 200;
      setPos({ x: rect.left, y: above ? rect.top - 6 : rect.bottom + 6, above });
    }
    setVisible(true);
    if (!info) fetchInfo();
  }

  async function addToVocab() {
    if (!info || !sessionId) return;
    await fetch("/api/vocabulary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        word,
        translation: info.translation,
        gender: info.gender,
        partOfSpeech: info.partOfSpeech,
        examples: info.examples,
      }),
    });
    setAdded(true);
  }

  // cleanup on unmount
  useEffect(() => () => clearHide(), []);

  const popup = visible ? (
    <div
      style={{
        position: "fixed",
        left: Math.min(pos.x, window.innerWidth - 280),
        top: pos.above ? undefined : pos.y,
        bottom: pos.above ? window.innerHeight - pos.y : undefined,
        zIndex: 9999,
      }}
      className="w-68 max-w-[17rem] rounded-lg border border-fiori-border bg-white p-3 shadow-xl text-sm"
      onMouseEnter={clearHide}
      onMouseLeave={scheduleHide}
    >
      {/* Word + gender */}
      <div className="flex items-baseline gap-2 mb-2">
        <span className="font-semibold text-fiori-text">{word}</span>
        {info?.gender && (
          <span className={`text-xs font-medium ${GENDER_COLOUR[info.gender] ?? "text-fiori-muted"}`}>
            {info.gender}
          </span>
        )}
        {info?.partOfSpeech && (
          <span className="ml-auto text-xs text-fiori-muted italic">
            {info.partOfSpeech}
          </span>
        )}
      </div>

      {/* Translation */}
      {info ? (
        <>
          <p className="text-fiori-text font-medium mb-2">= {info.translation}</p>

          {/* Examples */}
          {info.examples.length > 0 && (
            <ul className="space-y-1 mb-3">
              {info.examples.slice(0, 2).map((ex, i) => (
                <li key={i} className="text-xs text-fiori-muted leading-snug border-l-2 border-fiori-border pl-2">
                  {ex}
                </li>
              ))}
            </ul>
          )}

          {/* Add to vocabulary button — only for nouns/adj/adv */}
          {VOCAB_POS.has(info.partOfSpeech) && (
            <button
              onClick={addToVocab}
              disabled={added || !sessionId}
              className={`w-full rounded px-2 py-1 text-xs font-medium transition ${
                added
                  ? "bg-fiori-surface text-fiori-success cursor-default"
                  : "bg-fiori-blue text-white hover:opacity-90"
              }`}
            >
              {added ? "✓ Added to vocabulary" : "+ Add to vocabulary"}
            </button>
          )}
        </>
      ) : (
        <p className="text-xs text-fiori-muted animate-pulse">Looking up…</p>
      )}
    </div>
  ) : null;

  return (
    <>
      <span
        ref={spanRef}
        onMouseEnter={handleWordEnter}
        onMouseLeave={scheduleHide}
      >
        {word}
      </span>
      {typeof document !== "undefined" && popup
        ? ReactDOM.createPortal(popup, document.body)
        : null}
    </>
  );
}
