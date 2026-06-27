import { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "accent" | "ghost";

const variantClasses: Record<Variant, string> = {
  primary: "bg-fiori-blue text-white hover:opacity-90 border border-transparent",
  accent: "bg-fiori-orange text-white hover:opacity-90 border border-transparent",
  ghost: "bg-transparent text-fiori-blue hover:bg-fiori-surface border border-fiori-border",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export default function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      className={`rounded px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${variantClasses[variant]} ${className}`}
      {...props}
    />
  );
}
