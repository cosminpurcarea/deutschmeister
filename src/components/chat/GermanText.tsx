"use client";

import WordTooltip from "./WordTooltip";

interface Props {
  text: string;
  sessionId: string;
}

// Alternating captures: (word chars) or (non-word chars)
const TOKEN_RE = /([a-zA-ZäöüÄÖÜß]+)|([^a-zA-ZäöüÄÖÜß]+)/g;

export default function GermanText({ text, sessionId }: Props) {
  const tokens: { word: string; isWord: boolean }[] = [];
  let m: RegExpExecArray | null;
  TOKEN_RE.lastIndex = 0;
  while ((m = TOKEN_RE.exec(text)) !== null) {
    tokens.push({ word: m[0], isWord: Boolean(m[1]) });
  }

  return (
    <>
      {tokens.map((tok, i) => {
        if (tok.isWord && tok.word.length >= 3) {
          return (
            <WordTooltip
              key={i}
              word={tok.word}
              context={text}
              sessionId={sessionId}
            />
          );
        }
        // Short words, punctuation, whitespace — plain text node
        return <span key={i}>{tok.word}</span>;
      })}
    </>
  );
}
