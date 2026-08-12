import "@/styles/globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = { title: "PathPilot", description: "A career operating system for students." };
export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
