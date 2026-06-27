"use client";

import { useEffect, useState } from "react";
import SessionCard from "@/components/sessions/SessionCard";

interface Session {
  id: string;
  title: string;
  createdAt: string;
  messageCount: number;
  mistakeCount: number;
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/sessions")
      .then((r) => r.json())
      .then((data) => setSessions(data.sessions ?? []))
      .catch(() => setSessions([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="mb-6 text-2xl font-semibold text-fiori-text">
        Past Sessions
      </h1>

      {loading && (
        <p className="text-sm text-fiori-muted">Loading sessions…</p>
      )}

      {!loading && sessions.length === 0 && (
        <p className="text-sm text-fiori-muted">
          No sessions yet. Start chatting to create one!
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {sessions.map((s) => (
          <SessionCard
            key={s.id}
            id={s.id}
            title={s.title}
            createdAt={s.createdAt}
            messageCount={s.messageCount}
            mistakeCount={s.mistakeCount}
          />
        ))}
      </div>
    </div>
  );
}
