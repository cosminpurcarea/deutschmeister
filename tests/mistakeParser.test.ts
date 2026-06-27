import { describe, it, expect } from "vitest";
import { parseMistakes } from "@/lib/mistakeParser";

describe("parseMistakes", () => {
  it("extracts a single correction block and strips quotes", () => {
    const text = `Schön! Erzähl mir mehr.

---CORRECTIONS---
❌ You said: "Ich habe gestern ins Kino gegangen."
✅ Correct: "Ich bin gestern ins Kino gegangen."
📖 Why: Movement verbs take "sein" in the perfect tense.
🔁 Repeat: "Ich bin gestern ins Kino gegangen."
---END---`;

    const result = parseMistakes(text);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      wrong: "Ich habe gestern ins Kino gegangen.",
      correct: "Ich bin gestern ins Kino gegangen.",
      explanation: 'Movement verbs take "sein" in the perfect tense.',
      repeatPhrase: "Ich bin gestern ins Kino gegangen.",
    });
  });

  it("returns no mistakes for a Keine Fehler block", () => {
    const text = `Perfekt!

---CORRECTIONS---
✅ Keine Fehler! Try using "dennoch" for variety.
---END---`;

    expect(parseMistakes(text)).toHaveLength(0);
  });

  it("extracts multiple stacked correction blocks", () => {
    const text = `---CORRECTIONS---
❌ You said: "Ein Fehler"
✅ Correct: "Der Fehler"
📖 Why: Wrong article.
🔁 Repeat: "Der Fehler"
---END---
---CORRECTIONS---
❌ You said: "Zwei Fehler"
✅ Correct: "Der zweite Fehler"
📖 Why: Wrong ordinal.
🔁 Repeat: "Der zweite Fehler"
---END---`;

    const result = parseMistakes(text);
    expect(result).toHaveLength(2);
    expect(result[0].correct).toBe("Der Fehler");
    expect(result[1].wrong).toBe("Zwei Fehler");
  });

  it("returns an empty array when there are no blocks", () => {
    expect(parseMistakes("Just a plain message.")).toHaveLength(0);
    expect(parseMistakes("")).toHaveLength(0);
  });
});
