"use client";

import { useCallback, useEffect, useState } from "react";
import { getSessionId } from "@/lib/sessionId";
import type { VocabEntry } from "@/lib/vocabularyStore";
import VocabularyList from "@/components/vocabulary/VocabularyList";
import Badge from "@/components/fiori/Badge";

export default function VocabularyPage() {
  const [words, setWords] = useState<VocabEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    const sessionId = getSessionId();
    fetch(`/api/vocabulary?sessionId=${encodeURIComponent(sessionId)}`)
      .then((r) => r.json())
      .then((d) => setWords(d.words ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleMastered(id: string) {
    await fetch("/api/vocabulary", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setWords((prev) => prev.map((w) => (w.id === id ? { ...w, mastered: true } : w)));
  }

  async function handleRemove(id: string) {
    await fetch("/api/vocabulary", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setWords((prev) => prev.filter((w) => w.id !== id));
  }

  const activeCount = words.filter((w) => !w.mastered).length;

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold text-fiori-text">Vocabulary</h1>
        {activeCount > 0 && <Badge>{activeCount}</Badge>}
      </div>
      <p className="text-sm text-fiori-muted">
        Words you are building. The AI actively uses them in every response until you mark
        them as mastered.
      </p>

      {loading ? (
        <p className="text-sm text-fiori-muted">Loading…</p>
      ) : (
        <VocabularyList
          words={words}
          onMastered={handleMastered}
          onRemove={handleRemove}
        />
      )}
    </div>
  );
}
