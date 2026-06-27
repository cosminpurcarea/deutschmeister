"use client";

import { useEffect, useState } from "react";
import { getSessionId } from "@/lib/sessionId";
import Card from "@/components/fiori/Card";
import Badge from "@/components/fiori/Badge";
import MistakeLog, { MistakeRow } from "@/components/tracker/MistakeLog";
import RepetitionQueue, {
  RepetitionRow,
} from "@/components/tracker/RepetitionQueue";
import ProgressRing from "@/components/tracker/ProgressRing";

export default function MistakesPage() {
  const [mistakes, setMistakes] = useState<MistakeRow[]>([]);
  const [queue, setQueue] = useState<RepetitionRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sessionId = getSessionId();
    fetch(`/api/mistakes?sessionId=${encodeURIComponent(sessionId)}`)
      .then((r) => r.json())
      .then((data) => {
        setMistakes(data.mistakes ?? []);
        setQueue(data.repetitionQueue ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Accuracy proxy: share of distinct mistakes the learner has NOT repeated.
  const distinct = mistakes.length;
  const single = mistakes.filter((m) => m.count <= 1).length;
  const accuracy = distinct === 0 ? 100 : Math.round((single / distinct) * 100);

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-fiori-text">
          Mistake Tracker
        </h1>
        <Badge>{distinct}</Badge>
      </div>

      {loading ? (
        <p className="text-sm text-fiori-muted">Loading…</p>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-6">
            <Card className="flex items-center gap-4">
              <ProgressRing percent={accuracy} />
              <div>
                <p className="text-sm font-medium text-fiori-text">
                  Session accuracy
                </p>
                <p className="text-xs text-fiori-muted">
                  {single} of {distinct} patterns not repeated
                </p>
              </div>
            </Card>
          </div>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-fiori-text">Error log</h2>
            <MistakeLog mistakes={mistakes} />
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-fiori-text">
              Repetition queue
            </h2>
            <RepetitionQueue items={queue} />
          </section>
        </>
      )}
    </div>
  );
}
