"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSessionId } from "@/lib/sessionId";
import MiniChart, { ChartPoint } from "@/components/dashboard/MiniChart";

// ── Types ─────────────────────────────────────────────────────────────────────

interface DayVocab  { date: string; total: number; added: number }
interface DayChat   { date: string; messages: number; accuracy: number | null }
interface DayTrans  { date: string; attempts: number; accuracy: number | null }

interface DashData {
  vocab:       { total: number; active: number; mastered: number; chart: DayVocab[] };
  chat:        { weeklyAccuracy: number | null; chart: DayChat[] };
  translation: { total: number; weeklyAccuracy: number | null; chart: DayTrans[] };
  totals:      { sessions: number; messages: number; mistakes: number };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function dayLabel(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { weekday: "short" });
}

function pct(v: number | null): string {
  return v === null ? "—" : `${v}%`;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({
  icon,
  value,
  label,
  sub,
  href,
  accent,
}: {
  icon: string;
  value: string;
  label: string;
  sub?: string;
  href: string;
  accent?: string; // tailwind text color class
}) {
  return (
    <Link
      href={href}
      className="flex flex-col gap-2 rounded-lg border border-fiori-border bg-white p-4 shadow-sm transition hover:border-fiori-blue hover:shadow-md"
    >
      <div className="flex items-center justify-between">
        <span className="text-xl">{icon}</span>
        <span className={`text-2xl font-bold ${accent ?? "text-fiori-text"}`}>
          {value}
        </span>
      </div>
      <div>
        <p className="text-sm font-medium text-fiori-text">{label}</p>
        {sub && <p className="text-xs text-fiori-muted">{sub}</p>}
      </div>
    </Link>
  );
}

function ChartCard({
  title,
  sub,
  children,
}: {
  title: string;
  sub?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-fiori-border bg-white p-4 shadow-sm">
      <p className="mb-0.5 text-sm font-semibold text-fiori-text">{title}</p>
      {sub && <p className="mb-3 text-xs text-fiori-muted">{sub}</p>}
      {children}
    </div>
  );
}

// ── Empty state skeleton ──────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-24 rounded-lg bg-fiori-surface" />
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-36 rounded-lg bg-fiori-surface" />
        ))}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const [data, setData] = useState<DashData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sid = getSessionId();
    fetch(`/api/dashboard?sessionId=${encodeURIComponent(sid)}`)
      .then((r) => r.json())
      .then((d: DashData) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Convert chart arrays to ChartPoint[]
  const vocabBarPoints: ChartPoint[] = (data?.vocab.chart ?? []).map((d) => ({
    label: dayLabel(d.date),
    value: d.added,
  }));

  const chatLinePoints: ChartPoint[] = (data?.chat.chart ?? []).map((d) => ({
    label: dayLabel(d.date),
    value: d.accuracy,
  }));

  const transLinePoints: ChartPoint[] = (data?.translation.chart ?? []).map(
    (d) => ({ label: dayLabel(d.date), value: d.accuracy }),
  );

  const hasAnyData =
    data &&
    (data.totals.messages > 0 ||
      data.vocab.total > 0 ||
      data.translation.total > 0);

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-6">
      {/* Header */}
      <header>
        <h1 className="text-3xl font-semibold text-fiori-text">
          Deutsch<span className="text-fiori-blue">Meister</span>
        </h1>
        <p className="mt-1 text-fiori-muted">
          Your German learning progress at a glance.
        </p>
      </header>

      {loading && <Skeleton />}

      {!loading && (
        <>
          {/* ── KPI cards ──────────────────────────────────────────────── */}
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <StatCard
              icon="📚"
              value={String(data?.vocab.total ?? 0)}
              label="Words saved"
              sub={`${data?.vocab.active ?? 0} active · ${data?.vocab.mastered ?? 0} mastered`}
              href="/vocabulary"
              accent="text-fiori-blue"
            />
            <StatCard
              icon="💬"
              value={pct(data?.chat.weeklyAccuracy ?? null)}
              label="Chat accuracy"
              sub="7-day average"
              href="/chat"
              accent={
                (data?.chat.weeklyAccuracy ?? 0) >= 80
                  ? "text-fiori-success"
                  : "text-fiori-orange"
              }
            />
            <StatCard
              icon="📝"
              value={pct(data?.translation.weeklyAccuracy ?? null)}
              label="Translation accuracy"
              sub="perfect attempts this week"
              href="/translate"
              accent={
                (data?.translation.weeklyAccuracy ?? 0) >= 80
                  ? "text-fiori-success"
                  : "text-fiori-orange"
              }
            />
            <StatCard
              icon="✅"
              value={String(data?.vocab.mastered ?? 0)}
              label="Words mastered"
              sub="known without drilling"
              href="/vocabulary"
              accent="text-fiori-success"
            />
            <StatCard
              icon="🔴"
              value={String(data?.totals.mistakes ?? 0)}
              label="Mistakes logged"
              sub={`across ${data?.totals.sessions ?? 0} session${data?.totals.sessions !== 1 ? "s" : ""}`}
              href="/mistakes"
              accent="text-fiori-error"
            />
          </div>

          {/* ── Charts ─────────────────────────────────────────────────── */}
          {hasAnyData ? (
            <div className="grid gap-4 md:grid-cols-3">
              <ChartCard
                title="Vocabulary Growth"
                sub="New words saved per day"
              >
                <MiniChart
                  data={vocabBarPoints}
                  type="bar"
                  color="#0070f2"
                  yMax={Math.max(...vocabBarPoints.map((p) => p.value ?? 0), 1)}
                />
              </ChartCard>

              <ChartCard
                title="Chat Accuracy"
                sub="% AI responses with no corrections"
              >
                {chatLinePoints.every((p) => p.value === null) ? (
                  <p className="pt-6 text-center text-xs text-fiori-muted">
                    No chat data yet this week.
                  </p>
                ) : (
                  <MiniChart
                    data={chatLinePoints}
                    type="line"
                    color="#0070f2"
                    yMax={100}
                  />
                )}
              </ChartCard>

              <ChartCard
                title="Translation Accuracy"
                sub="% perfect translations per day"
              >
                {transLinePoints.every((p) => p.value === null) ? (
                  <p className="pt-6 text-center text-xs text-fiori-muted">
                    No translation data yet this week.
                  </p>
                ) : (
                  <MiniChart
                    data={transLinePoints}
                    type="line"
                    color="#f0ab00"
                    yMax={100}
                  />
                )}
              </ChartCard>
            </div>
          ) : (
            // ── First-run empty state ───────────────────────────────────
            <div className="rounded-lg border border-dashed border-fiori-border bg-fiori-surface p-8 text-center text-sm text-fiori-muted">
              Charts will appear here after your first chat or translation
              exercise. Start below! 👇
            </div>
          )}

          {/* ── Quick-action tiles ──────────────────────────────────────── */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                href: "/chat",
                icon: "💬",
                label: "Chat",
                sub: "Practice conversation",
              },
              {
                href: "/translate",
                icon: "📝",
                label: "Translate",
                sub: "Paragraph exercises",
              },
              {
                href: "/mistakes",
                icon: "📊",
                label: "Mistakes",
                sub: "Error log & drills",
              },
              {
                href: "/sessions",
                icon: "🗂️",
                label: "Sessions",
                sub: "Past conversations",
              },
            ].map((t) => (
              <Link
                key={t.href}
                href={t.href}
                className="flex items-center gap-3 rounded-lg border border-fiori-border bg-white p-4 shadow-sm transition hover:border-fiori-blue hover:shadow-md"
              >
                <span className="text-2xl">{t.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-fiori-text">
                    {t.label}
                  </p>
                  <p className="text-xs text-fiori-muted">{t.sub}</p>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
