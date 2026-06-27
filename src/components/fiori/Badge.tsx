import { HTMLAttributes } from "react";

export default function Badge({
  className = "",
  children,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={`inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-fiori-orange px-2 py-0.5 text-xs font-semibold text-white ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
