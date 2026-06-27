export interface Scenario {
  situation?: string;
  yourRole?: string;
  myRole?: string;
  opener?: string;
}

export default function ScenarioCard({ scenario }: { scenario: Scenario }) {
  return (
    <div className="rounded-lg border-2 border-fiori-orange bg-white p-4 text-sm">
      <p className="mb-2 font-semibold text-fiori-orange">🎭 New Scenario</p>
      {scenario.situation && (
        <p className="mb-1">
          <span className="font-medium">Situation:</span> {scenario.situation}
        </p>
      )}
      {scenario.yourRole && (
        <p className="mb-1">
          <span className="font-medium">👤 Your role:</span> {scenario.yourRole}
        </p>
      )}
      {scenario.myRole && (
        <p className="mb-1">
          <span className="font-medium">🤖 My role:</span> {scenario.myRole}
        </p>
      )}
      {scenario.opener && (
        <p className="mt-2 whitespace-pre-wrap font-medium text-fiori-text">
          ▶️ {scenario.opener}
        </p>
      )}
    </div>
  );
}
