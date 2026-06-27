export interface MistakeRow {
  id: string;
  wrong: string;
  correct: string;
  explanation: string;
  repeatPhrase: string;
  count: number;
  topic: string;
}

export default function MistakeLog({ mistakes }: { mistakes: MistakeRow[] }) {
  if (mistakes.length === 0) {
    return (
      <p className="text-sm text-fiori-muted">
        No mistakes logged yet. Head to the chat and start practising!
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-fiori-border">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="bg-fiori-surface text-fiori-muted">
            <th className="px-3 py-2 font-medium">Wrong</th>
            <th className="px-3 py-2 font-medium">Correct</th>
            <th className="px-3 py-2 font-medium">Count</th>
            <th className="px-3 py-2 font-medium">Topic</th>
            <th className="px-3 py-2 font-medium">Repeat</th>
          </tr>
        </thead>
        <tbody>
          {mistakes.map((m) => (
            <tr key={m.id} className="border-t border-fiori-border align-top">
              <td className="px-3 py-2 text-fiori-error">{m.wrong}</td>
              <td className="px-3 py-2 text-fiori-success">{m.correct}</td>
              <td className="px-3 py-2 font-semibold">{m.count}</td>
              <td className="px-3 py-2 text-fiori-muted">{m.topic}</td>
              <td className="px-3 py-2 italic text-fiori-text">
                {m.repeatPhrase}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
