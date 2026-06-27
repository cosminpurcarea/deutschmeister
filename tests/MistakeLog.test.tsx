import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import MistakeLog, { MistakeRow } from "@/components/tracker/MistakeLog";

const rows: MistakeRow[] = [
  {
    id: "1",
    wrong: "Ich habe gegangen",
    correct: "Ich bin gegangen",
    explanation: "sein with movement",
    repeatPhrase: "Ich bin gegangen",
    count: 3,
    topic: "daily life",
  },
  {
    id: "2",
    wrong: "der Mädchen",
    correct: "das Mädchen",
    explanation: "neuter noun",
    repeatPhrase: "Mädchen ist neutrum",
    count: 1,
    topic: "grammar",
  },
];

describe("MistakeLog", () => {
  it("renders one table row per mistake", () => {
    render(<MistakeLog mistakes={rows} />);
    // 2 data rows + 1 header row
    expect(screen.getAllByRole("row")).toHaveLength(3);
    expect(screen.getByText("Ich habe gegangen")).toBeInTheDocument();
    expect(screen.getByText("das Mädchen")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("daily life")).toBeInTheDocument();
  });

  it("shows an empty state when there are no mistakes", () => {
    render(<MistakeLog mistakes={[]} />);
    expect(screen.getByText(/No mistakes logged yet/i)).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });
});
