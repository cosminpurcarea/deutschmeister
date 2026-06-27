export interface RepetitionRow {
  id: string;
  phrase: string;
  drilledCount: number;
}

export default function RepetitionQueue({
  items,
}: {
  items: RepetitionRow[];
}) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-fiori-muted">
        Nothing to drill yet. Repeated mistakes (made 2+ times) show up here.
      </p>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <div
          key={item.id}
          className="rounded-lg border-2 border-fiori-orange bg-white p-3"
        >
          <p className="text-sm font-medium text-fiori-text">🔁 {item.phrase}</p>
          <p className="mt-1 text-xs text-fiori-muted">
            Drilled {item.drilledCount}/3
          </p>
        </div>
      ))}
    </div>
  );
}
