import { ReactNode } from "react";

export default function MessageBubble({
  role,
  children,
}: {
  role: "user" | "assistant";
  children: ReactNode;
}) {
  const isUser = role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isUser
            ? "rounded-br-sm bg-fiori-blue text-white"
            : "rounded-bl-sm border border-fiori-border bg-white text-fiori-text"
        }`}
      >
        {children}
      </div>
    </div>
  );
}
