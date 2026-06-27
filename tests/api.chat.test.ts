import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/deepseek", () => ({
  DEEPSEEK_MODEL: "deepseek-chat",
  deepseek: { chat: { completions: { create: vi.fn() } } },
}));

vi.mock("@/lib/mistakeStore", () => ({
  ensureSession: vi.fn().mockResolvedValue(undefined),
  persistMistakes: vi.fn().mockResolvedValue(undefined),
  topRepetitionPhrases: vi.fn().mockResolvedValue([]),
}));

import { POST } from "@/app/api/chat/route";
import { deepseek } from "@/lib/deepseek";
import { persistMistakes } from "@/lib/mistakeStore";

function mockCompletion(parts: string[]) {
  return {
    async *[Symbol.asyncIterator]() {
      for (const p of parts) {
        yield { choices: [{ delta: { content: p } }] };
      }
    },
  };
}

function mockRequest(body: unknown) {
  return { json: async () => body } as unknown as Parameters<typeof POST>[0];
}

describe("POST /api/chat", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("streams the DeepSeek response back to the client", async () => {
    (deepseek.chat.completions.create as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockCompletion(["Hallo", " Welt!"]),
    );

    const res = await POST(
      mockRequest({
        sessionId: "s1",
        messages: [{ role: "user", content: "hi" }],
      }),
    );

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("text/plain");
    const text = await res.text();
    expect(text).toBe("Hallo Welt!");
  });

  it("parses and persists mistakes from the streamed text", async () => {
    const aiText = `Gut!

---CORRECTIONS---
❌ You said: "Ich habe gegangen."
✅ Correct: "Ich bin gegangen."
📖 Why: sein with movement.
🔁 Repeat: "Ich bin gegangen."
---END---`;

    (deepseek.chat.completions.create as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockCompletion([aiText]),
    );

    await (await POST(
      mockRequest({
        sessionId: "s2",
        messages: [{ role: "user", content: "x" }],
      }),
    )).text();

    expect(persistMistakes).toHaveBeenCalledTimes(1);
    const [, parsed] = (persistMistakes as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(parsed).toHaveLength(1);
    expect(parsed[0].correct).toBe("Ich bin gegangen.");
  });

  it("returns 400 when sessionId or messages are missing", async () => {
    const res = await POST(mockRequest({ messages: [] }));
    expect(res.status).toBe(400);
  });
});
