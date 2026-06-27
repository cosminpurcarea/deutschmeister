"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Badge from "@/components/fiori/Badge";
import { getSessionId } from "@/lib/sessionId";

export default function HomePage() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    const sessionId = getSessionId();
    fetch(`/api/mistakes?sessionId=${encodeURIComponent(sessionId)}`)
      .then((r) => r.json())
      .then((data) => setCount((data.mistakes ?? []).length))
      .catch(() => setCount(0));
  }, []);

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-semibold text-fiori-text">
          Deutsch<span className="text-fiori-blue">Meister</span>
        </h1>
        <p className="text-fiori-muted">
          Practise German B1–B2 with an AI teacher that corrects every message.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <Link
          href="/chat"
          className="group flex flex-col justify-between rounded-lg border border-fiori-border bg-white p-5 shadow-sm transition hover:border-fiori-blue"
        >
          <span className="text-3xl">💬</span>
          <div className="mt-6">
            <p className="font-semibold text-fiori-text">Start Chat</p>
            <p className="text-sm text-fiori-muted">
              Talk in German, get instant corrections.
            </p>
          </div>
        </Link>

        <Link
          href="/mistakes"
          className="group flex flex-col justify-between rounded-lg border border-fiori-border bg-white p-5 shadow-sm transition hover:border-fiori-blue"
        >
          <div className="flex items-start justify-between">
            <span className="text-3xl">📊</span>
            {count !== null && count > 0 && <Badge>{count}</Badge>}
          </div>
          <div className="mt-6">
            <p className="font-semibold text-fiori-text">View Mistakes</p>
            <p className="text-sm text-fiori-muted">
              Your error log and repetition queue.
            </p>
          </div>
        </Link>

        <a
          href="#how-it-works"
          className="group flex flex-col justify-between rounded-lg border border-fiori-border bg-white p-5 shadow-sm transition hover:border-fiori-blue"
        >
          <span className="text-3xl">💡</span>
          <div className="mt-6">
            <p className="font-semibold text-fiori-text">How It Works</p>
            <p className="text-sm text-fiori-muted">
              Learn the correction &amp; drilling loop.
            </p>
          </div>
        </a>
      </div>

      <section
        id="how-it-works"
        className="space-y-2 rounded-lg border border-fiori-border bg-fiori-surface p-5"
      >
        <h2 className="text-lg font-semibold text-fiori-text">How It Works</h2>
        <ol className="list-decimal space-y-1 pl-5 text-sm text-fiori-muted">
          <li>Chat naturally in German — the teacher always replies in character.</li>
          <li>Every reply ends with a correction block (or a “no mistakes” note).</li>
          <li>Each correction is saved to your personal mistake log.</li>
          <li>Repeated mistakes are drilled back into future conversations.</li>
        </ol>
      </section>
    </div>
  );
}
