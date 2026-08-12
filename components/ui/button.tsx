import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";
type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" };
export function Button({ className, variant = "primary", ...props }: ButtonProps) { const variants = { primary: "bg-[#3456c7] text-white", secondary: "border border-[#e7e9ee] bg-white text-[#141722]", ghost: "bg-transparent text-[#3456c7]" }; return <button className={cn("inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50", variants[variant], className)} {...props} />; }
