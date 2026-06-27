export interface ParsedMistake {
  wrong: string;
  correct: string;
  explanation: string;
  repeatPhrase: string;
}

const BLOCK_RE = /---CORRECTIONS---([\s\S]*?)---END---/g;

function clean(value: string): string {
  let v = value.trim();
  // strip a single layer of surrounding quotes (straight or typographic)
  const pairs: [string, string][] = [
    ['"', '"'],
    ["'", "'"],
    ["“", "”"],
    ["‘", "’"],
  ];
  for (const [open, close] of pairs) {
    if (v.startsWith(open) && v.endsWith(close) && v.length >= 2) {
      v = v.slice(open.length, v.length - close.length).trim();
      break;
    }
  }
  return v;
}

function valueAfterLabel(line: string): string {
  const idx = line.indexOf(":");
  const raw = idx >= 0 ? line.slice(idx + 1) : line;
  return clean(raw);
}

/**
 * Extracts every CORRECTIONS block from an AI response and returns one
 * ParsedMistake per ❌/✅/📖/🔁 group. Blocks marked "Keine Fehler" yield none.
 */
export function parseMistakes(text: string): ParsedMistake[] {
  const mistakes: ParsedMistake[] = [];
  if (!text) return mistakes;

  let match: RegExpExecArray | null;
  BLOCK_RE.lastIndex = 0;
  while ((match = BLOCK_RE.exec(text)) !== null) {
    const block = match[1];
    if (/keine fehler/i.test(block)) continue;

    const wrong: string[] = [];
    const correct: string[] = [];
    const explanation: string[] = [];
    const repeatPhrase: string[] = [];

    for (const line of block.split("\n")) {
      const t = line.trim();
      if (t.startsWith("❌")) wrong.push(valueAfterLabel(t));
      else if (t.startsWith("✅")) correct.push(valueAfterLabel(t));
      else if (t.startsWith("📖")) explanation.push(valueAfterLabel(t));
      else if (t.startsWith("🔁")) repeatPhrase.push(valueAfterLabel(t));
    }

    const count = Math.max(
      wrong.length,
      correct.length,
      explanation.length,
      repeatPhrase.length,
    );
    for (let i = 0; i < count; i++) {
      mistakes.push({
        wrong: wrong[i] ?? "",
        correct: correct[i] ?? "",
        explanation: explanation[i] ?? "",
        repeatPhrase: repeatPhrase[i] ?? "",
      });
    }
  }

  return mistakes;
}
