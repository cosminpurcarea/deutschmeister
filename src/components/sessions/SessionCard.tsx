import Link from "next/link";

interface SessionCardProps {
  id: string;
  title: string;
  createdAt: string;
  messageCount: number;
  mistakeCount: number;
}

export default function SessionCard({
  id,
  title,
  createdAt,
  messageCount,
  mistakeCount,
}: SessionCardProps) {
  const date = new Date(createdAt).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const time = new Date(createdAt).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Link
      href={`/sessions/${id}`}
      className="block rounded border border-fiori-border bg-white p-4 shadow-sm transition hover:border-fiori-blue hover:shadow-md"
    >
      <p className="mb-1 truncate text-sm font-semibold text-fiori-text">
        {title}
      </p>
      <p className="mb-3 text-xs text-fiori-muted">
        {date} · {time}
      </p>
      <div className="flex gap-4 text-xs text-fiori-muted">
        <span>
          <span className="font-medium text-fiori-text">{messageCount}</span>{" "}
          messages
        </span>
        <span>
          <span className="font-medium text-fiori-error">{mistakeCount}</span>{" "}
          mistakes
        </span>
      </div>
    </Link>
  );
}
