import type { Metadata } from "next";
import "./globals.css";
import Shell from "@/components/fiori/Shell";

export const metadata: Metadata = {
  title: "DeutschMeister",
  description: "German language practice powered by DeepSeek V3",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-fiori antialiased">
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
