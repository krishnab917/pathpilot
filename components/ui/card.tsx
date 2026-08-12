import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";
export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) { return <section className={cn("rounded-2xl border border-[#e7e9ee] bg-white p-5 shadow-[0_10px_30px_rgba(17,24,39,0.04)]", className)} {...props} />; }
