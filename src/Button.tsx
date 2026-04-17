import type { ButtonHTMLAttributes, ReactNode } from "react";
import { forwardRef } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost";

export type ButtonProps = {
  /** Visual style preset */
  variant?: ButtonVariant;
  children?: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>;

const variantClass: Record<ButtonVariant, string> = {
  primary: "stlss-btn--primary",
  secondary: "stlss-btn--secondary",
  ghost: "stlss-btn--ghost",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", className, disabled, type = "button", children, ...rest },
  ref,
) {
  const mergedClassName = ["stlss-btn", variantClass[variant], className].filter(Boolean).join(" ");

  return (
    <button ref={ref} type={type} className={mergedClassName} disabled={disabled} {...rest}>
      {children}
    </button>
  );
});
