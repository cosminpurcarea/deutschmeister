import type { ParsedMistake } from "@/lib/mistakeParser";

/**
 * Renders one correction (red wrong -> green correct). When `mistake` is
 * omitted, shows the "no mistakes" state so a correction area is always shown.
 */
export default function CorrectionBlock({
  mistake,
  note,
}: {
  mistake?: ParsedMistake | null;
  note?: string;
}) {
  if (!mistake) {
    return (
      <div className="rounded-lg border border-fiori-border bg-fiori-surface p-3 text-sm">
        <p className="font-semibold text-fiori-success">✅ Keine Fehler!</p>
        {note && <p className="mt-1 text-fiori-muted">{note}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-1.5 rounded-lg border border-fiori-border bg-fiori-surface p-3 text-sm">
      <p>
        <span className="mr-1">❌</span>
        <span className="font-medium text-fiori-error line-through">
          {mistake.wrong}
        </span>
      </p>
      <p>
        <span className="mr-1">✅</span>
        <span className="font-medium text-fiori-success">{mistake.correct}</span>
      </p>
      {mistake.explanation && (
        <p className="text-fiori-muted">
          <span className="mr-1">📖</span>
          {mistake.explanation}
        </p>
      )}
      {mistake.repeatPhrase && (
        <p className="text-fiori-text">
          <span className="mr-1">🔁</span>
          <span className="italic">{mistake.repeatPhrase}</span>
        </p>
      )}
    </div>
  );
}
