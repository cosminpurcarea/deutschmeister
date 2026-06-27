import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import CorrectionBlock from "@/components/chat/CorrectionBlock";

describe("CorrectionBlock", () => {
  it("renders wrong, correct and explanation for a mistake", () => {
    render(
      <CorrectionBlock
        mistake={{
          wrong: "Ich habe gegangen",
          correct: "Ich bin gegangen",
          explanation: "Movement verbs take sein.",
          repeatPhrase: "sein + Partizip",
        }}
      />,
    );

    expect(screen.getByText("Ich habe gegangen")).toBeInTheDocument();
    expect(screen.getByText("Ich bin gegangen")).toBeInTheDocument();
    expect(screen.getByText(/Movement verbs take sein/i)).toBeInTheDocument();
  });

  it("renders the no-mistakes state when no mistake is provided", () => {
    render(<CorrectionBlock note="Try using 'dennoch'." />);
    expect(screen.getByText(/Keine Fehler/i)).toBeInTheDocument();
    expect(screen.getByText(/dennoch/i)).toBeInTheDocument();
  });
});
