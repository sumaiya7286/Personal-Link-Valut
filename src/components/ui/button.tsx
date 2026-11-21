import { forwardRef, type ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
/** Pick a size instead of overriding h-/w-/px- via className: conflicting utilities don't merge. */
type Size = "sm" | "md" | "lg" | "icon" | "field" | "fieldIcon";

const variants: Record<Variant, string> = {
  primary: "bg-lime text-on-lime font-semibold shadow-[0_1px_2px_rgba(0,0,0,0.35)] hover:bg-lime-strong",
  secondary: "glass text-text hover:bg-white/[0.09] hover:border-white/20",
  ghost: "text-muted hover:text-text hover:bg-white/[0.06]",
  danger: "bg-danger/15 text-danger border border-danger/30 hover:bg-danger/25",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3 text-sm rounded-xl gap-1.5",
  md: "h-11 px-4 text-[15px] rounded-xl gap-2",
  lg: "h-13 px-6 text-base rounded-2xl gap-2.5",
  icon: "size-11 rounded-xl",
  field: "h-12 px-4 text-[15px] rounded-2xl gap-2",
  fieldIcon: "size-12 rounded-2xl",
};

export const buttonClass = (variant: Variant = "secondary", size: Size = "md", extra = "") =>
  `inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap transition-[background-color,box-shadow,color,border-color,transform] duration-200 ease-[var(--ease-out)] active:scale-[0.97] disabled:opacity-50 disabled:active:scale-100 ${variants[variant]} ${sizes[size]} ${extra}`;

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }
>(function Button({ variant = "secondary", size = "md", className = "", type = "button", ...props }, ref) {
  return <button ref={ref} type={type} className={buttonClass(variant, size, className)} {...props} />;
});
