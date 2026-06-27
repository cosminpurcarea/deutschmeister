import { HTMLAttributes } from "react";

export default function Card({
  className = "",
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-lg border border-fiori-border bg-white p-4 shadow-sm ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
