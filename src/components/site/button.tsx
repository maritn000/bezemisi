import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "blue" | "green" | "outline";

const variantClass: Record<Variant, string> = {
  blue: "button-blue",
  green: "button-green",
  outline: "button-outline",
};

export function Button({
  variant = "blue",
  className = "",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  children: ReactNode;
}) {
  return (
    <button
      className={`button ${variantClass[variant]} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
}

export function ButtonLink({
  href,
  variant = "blue",
  className = "",
  children,
}: {
  href: string;
  variant?: Variant;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`button ${variantClass[variant]} ${className}`.trim()}
    >
      {children}
    </Link>
  );
}
