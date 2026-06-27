import Link from "next/link";
import { ReactNode } from "react";

const navItems = [
  { label: "Home", href: "/" },
  { label: "Chat", href: "/chat" },
  { label: "Mistakes", href: "/mistakes" },
];

export default function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-fiori-background">
      <header className="flex items-center justify-between border-b border-fiori-border bg-white px-6 py-3 shadow-sm">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded bg-fiori-blue text-sm font-bold text-white">
            D
          </span>
          <span className="text-lg font-semibold text-fiori-text">
            Deutsch<span className="text-fiori-blue">Meister</span>
          </span>
        </Link>
        <nav className="flex items-center gap-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-fiori-muted transition hover:text-fiori-blue"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
