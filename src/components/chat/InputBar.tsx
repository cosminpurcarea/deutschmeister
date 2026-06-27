"use client";

import { KeyboardEvent } from "react";
import Button from "@/components/fiori/Button";

export default function InputBar({
  value,
  onChange,
  onSend,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  disabled?: boolean;
}) {
  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!disabled && value.trim()) onSend();
    }
  }

  return (
    <div className="flex items-end gap-2 border-t border-fiori-border bg-white p-3">
      <textarea
        className="max-h-40 min-h-[44px] flex-1 resize-none rounded-lg border border-fiori-border bg-white px-3 py-2 text-sm text-fiori-text outline-none focus:border-fiori-blue"
        placeholder="Schreib auf Deutsch… (Enter to send, Shift+Enter for newline)"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={1}
        aria-label="Message input"
      />
      <Button
        variant="primary"
        onClick={onSend}
        disabled={disabled || !value.trim()}
      >
        Send
      </Button>
    </div>
  );
}
