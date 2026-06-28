"use client";

import { useState } from "react";
import { parseMistakes } from "@/lib/mistakeParser";
import { getSessionId } from "@/lib/sessionId";
import CorrectionBlock from "@/components/chat/CorrectionBlock";

// ── Types ────────────────────────────────────────────────────────────────────

interface Paragraph {
  text: string;
  lang: string;
  level: string;
  topic: string;
}

// ── Constants ────────────────────────────────────────────────────────────────

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "fr", label: "French" },
  { code: "es", label: "Spanish" },
  { code: "it", label: "Italian" },
  { code: "pt", label: "Portuguese" },
  { code: "ro", label: "Romanian" },
];

const LEVELS = ["A1", "A2", "B1", "B2", "C1"];

// ── Feedback parser ──────────────────────────────────────────────────────────

function parseFeedback(content: string) {
  const correctedMatch = content.match(/---CORRECTED---([\s\S]*?)---END---/);
  const corrected = correctedMatch ? correctedMatch[1].trim() : null;

  const mistakes = parseMistakes(content);

  const allCorrections = Array.from(
    content.matchAll(/---CORRECTIONS---([\s\S]*?)---END---/g),
  );
  const hasCorrections = allCorrections.length > 0;
  const noMistakes = hasCorrections && mistakes.length === 0;

  let note: string | undefined;
  for (const m of allCorrections) {
    const nm = m[1].match(/keine fehler!?\s*(.*)/i);
    if (nm?.[1]?.trim()) { note = nm[1].trim(); break; }
  }

  const scoreMatch = content.match(/---SCORE---([\s\S]*?)---END---/);
  const score = scoreMatch ? scoreMatch[1].trim() : null;

  return { corrected, mistakes, hasCorrections, noMistakes, note, score };
}

// ── Component ────────────────────────────────────────────────────────────────

export default function TranslateWindow() {
  const [sessionId] = useState(() => getSessionId());
  const [lang, setLang] = useState("en");
  const [level, setLevel] = useState("B1");
  const [paragraph, setParagraph] = useState<Paragraph | null>(null);
  const [loadingParagraph, setLoadingParagraph] = useState(false);
  const [translation, setTranslation] = useState("");
  const [feedback, setFeedback] = useState("");
  const [checking, setChecking] = useState(false);

  async function fetchParagraph() {
    setLoadingParagraph(true);
    setFeedback("");
    setTranslation("");
    setParagraph(null);
    try {
      const res = await fetch(
        `/api/translate/paragraph?lang=${lang}&level=${level}`,
      );
      const data = await res.json();
      if (data.text) setParagraph(data);
    } catch {
      // silently leave paragraph as null — user sees the "try again" state
    } finally {
      setLoadingParagraph(false);
    }
  }

  async function checkTranslation() {
    if (!paragraph || !translation.trim() || checking) return;
    setChecking(true);
    setFeedback("");

    try {
      const res = await fetch("/api/translate/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceText: paragraph.text,
          userTranslation: translation.trim(),
          sourceLang: lang,
          level: paragraph.level,
          sessionId,
        }),
      });

      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setFeedback(acc);
      }
    } catch {
      setFeedback("⚠️ Could not reach the teacher. Please try again.");
    } finally {
      setChecking(false);
    }
  }

  const parsed = feedback ? parseFeedback(feedback) : null;

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-fiori-text">
          Translation Practice
        </h1>
        <p className="mt-1 text-sm text-fiori-muted">
          Translate a paragraph into German — get instant AI feedback on every
          word choice and grammar point.
        </p>
      </div>

      {/* Controls row */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium uppercase tracking-wide text-fiori-muted">
            Translate from
          </label>
          <select
            value={lang}
            onChange={(e) => {
              setLang(e.target.value);
              setParagraph(null);
              setFeedback("");
              setTranslation("");
            }}
            className="rounded border border-fiori-border bg-white px-3 py-1.5 text-sm text-fiori-text focus:outline-none focus:ring-2 focus:ring-fiori-blue"
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-medium uppercase tracking-wide text-fiori-muted">
            Level
          </label>
          <select
            value={level}
            onChange={(e) => {
              setLevel(e.target.value);
              setParagraph(null);
              setFeedback("");
              setTranslation("");
            }}
            className="rounded border border-fiori-border bg-white px-3 py-1.5 text-sm text-fiori-text focus:outline-none focus:ring-2 focus:ring-fiori-blue"
          >
            {LEVELS.map((lv) => (
              <option key={lv} value={lv}>
                {lv}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={fetchParagraph}
          disabled={loadingParagraph}
          className="ml-auto rounded bg-fiori-blue px-4 py-1.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {loadingParagraph
            ? "Generating…"
            : paragraph
              ? "New Paragraph"
              : "Get Paragraph →"}
        </button>
      </div>

      {/* Empty state */}
      {!paragraph && !loadingParagraph && (
        <div className="rounded-lg border border-dashed border-fiori-border bg-fiori-surface p-10 text-center">
          <p className="text-sm text-fiori-muted">
            Click <span className="font-medium text-fiori-text">Get Paragraph</span>{" "}
            to receive your translation exercise.
          </p>
        </div>
      )}

      {/* Loading skeleton */}
      {loadingParagraph && (
        <div className="animate-pulse rounded-lg border border-fiori-border bg-white p-5">
          <div className="mb-2 h-3 w-24 rounded bg-fiori-surface" />
          <div className="space-y-2">
            <div className="h-4 rounded bg-fiori-surface" />
            <div className="h-4 w-5/6 rounded bg-fiori-surface" />
            <div className="h-4 w-4/6 rounded bg-fiori-surface" />
          </div>
        </div>
      )}

      {/* Source paragraph */}
      {paragraph && !loadingParagraph && (
        <>
          <div className="rounded-lg border-l-4 border-fiori-blue bg-white p-5 shadow-sm">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-fiori-blue">
              {paragraph.topic} · {paragraph.level}
            </p>
            <p className="text-sm leading-relaxed text-fiori-text">
              {paragraph.text}
            </p>
          </div>

          {/* Translation textarea */}
          <div>
            <label className="mb-2 block text-sm font-medium text-fiori-text">
              Your German translation
            </label>
            <textarea
              value={translation}
              onChange={(e) => {
                setTranslation(e.target.value);
                // clear old feedback when the user edits their answer
                if (feedback) setFeedback("");
              }}
              placeholder="Schreib deine Übersetzung hier…"
              rows={6}
              className="w-full resize-none rounded-lg border border-fiori-border bg-white p-3 text-sm text-fiori-text placeholder-fiori-muted focus:outline-none focus:ring-2 focus:ring-fiori-blue"
            />
            <div className="mt-2 flex justify-end">
              <button
                onClick={checkTranslation}
                disabled={!translation.trim() || checking}
                className="rounded bg-fiori-orange px-5 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
              >
                {checking ? "Checking…" : "Check Translation →"}
              </button>
            </div>
          </div>

          {/* Feedback section */}
          {(feedback || checking) && (
            <div className="space-y-3">
              <div className="flex items-center gap-3 border-b border-fiori-border pb-2">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-fiori-text">
                  Feedback
                </h2>
                {checking && (
                  <span className="text-xs text-fiori-muted animate-pulse">
                    DeutschMeister is reviewing…
                  </span>
                )}
              </div>

              {/* Corrected version */}
              {parsed?.corrected && (
                <div className="rounded-lg border border-fiori-success bg-white p-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-fiori-success">
                    ✅ Ideal Translation
                  </p>
                  <p className="text-sm leading-relaxed text-fiori-text">
                    {parsed.corrected}
                  </p>
                </div>
              )}

              {/* Individual corrections — reuses the same CorrectionBlock as chat */}
              {parsed?.mistakes.map((mk, i) => (
                <CorrectionBlock key={i} mistake={mk} />
              ))}

              {/* Perfect translation */}
              {parsed?.hasCorrections && parsed.noMistakes && (
                <CorrectionBlock note={parsed.note} />
              )}

              {/* Overall assessment */}
              {parsed?.score && (
                <div className="rounded-lg border border-fiori-border bg-fiori-surface p-4">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-fiori-muted">
                    Overall Assessment
                  </p>
                  <p className="text-sm leading-relaxed text-fiori-text">
                    {parsed.score}
                  </p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
