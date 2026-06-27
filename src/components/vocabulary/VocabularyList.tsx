import type { VocabEntry } from "@/lib/vocabularyStore";

const GENDER_COLOUR: Record<string, string> = {
  der: "text-fiori-blue",
  die: "text-fiori-error",
  das: "text-fiori-success",
};

export default function VocabularyList({
  words,
  onMastered,
  onRemove,
}: {
  words: VocabEntry[];
  onMastered: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  if (words.length === 0) {
    return (
      <p className="text-sm text-fiori-muted">
        No words saved yet. Hover over any German word in the chat and click{" "}
        <strong>+ Add to vocabulary</strong>.
      </p>
    );
  }

  const active = words.filter((w) => !w.mastered);
  const mastered = words.filter((w) => w.mastered);

  return (
    <div className="space-y-6">
      {active.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-base font-semibold text-fiori-text">
            Being drilled ({active.length})
          </h3>
          <div className="overflow-x-auto rounded-lg border border-fiori-border">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="bg-fiori-surface text-fiori-muted">
                  <th className="px-3 py-2 font-medium">Word</th>
                  <th className="px-3 py-2 font-medium">Translation</th>
                  <th className="px-3 py-2 font-medium">Examples</th>
                  <th className="px-3 py-2 font-medium text-center">Used by AI</th>
                  <th className="px-3 py-2 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {active.map((w) => (
                  <WordRow
                    key={w.id}
                    word={w}
                    onMastered={onMastered}
                    onRemove={onRemove}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {mastered.length > 0 && (
        <section className="space-y-3 opacity-60">
          <h3 className="text-base font-semibold text-fiori-text">
            Mastered ✓ ({mastered.length})
          </h3>
          <div className="overflow-x-auto rounded-lg border border-fiori-border">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="bg-fiori-surface text-fiori-muted">
                  <th className="px-3 py-2 font-medium">Word</th>
                  <th className="px-3 py-2 font-medium">Translation</th>
                  <th className="px-3 py-2 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {mastered.map((w) => (
                  <tr key={w.id} className="border-t border-fiori-border">
                    <td className="px-3 py-2 font-medium text-fiori-text">{w.word}</td>
                    <td className="px-3 py-2 text-fiori-muted">{w.translation}</td>
                    <td className="px-3 py-2 text-right">
                      <button
                        onClick={() => onRemove(w.id)}
                        className="text-xs text-fiori-muted hover:text-fiori-error"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

function WordRow({
  word: w,
  onMastered,
  onRemove,
}: {
  word: VocabEntry;
  onMastered: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <tr className="border-t border-fiori-border align-top">
      <td className="px-3 py-2">
        <span className="font-semibold text-fiori-text">{w.word}</span>
        {w.gender && (
          <span
            className={`ml-1 text-xs font-medium ${GENDER_COLOUR[w.gender] ?? "text-fiori-muted"}`}
          >
            {w.gender}
          </span>
        )}
      </td>
      <td className="px-3 py-2 text-fiori-text">{w.translation}</td>
      <td className="px-3 py-2 max-w-xs">
        {w.examples.slice(0, 2).map((ex, i) => (
          <p key={i} className="text-xs text-fiori-muted leading-snug">
            {ex}
          </p>
        ))}
      </td>
      <td className="px-3 py-2 text-center font-semibold text-fiori-text">
        {w.timesUsedByAI}
      </td>
      <td className="px-3 py-2 text-right space-x-2 whitespace-nowrap">
        <button
          onClick={() => onMastered(w.id)}
          className="rounded px-2 py-1 text-xs font-medium bg-fiori-surface text-fiori-success hover:bg-fiori-success hover:text-white transition"
        >
          ✓ Mastered
        </button>
        <button
          onClick={() => onRemove(w.id)}
          className="text-xs text-fiori-muted hover:text-fiori-error"
        >
          Remove
        </button>
      </td>
    </tr>
  );
}
