"use client";

import { useSidebar } from "./SidebarProvider";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function ClientMainContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar();

  return (
    <main className={cn(
      "flex-1 transition-all duration-300 min-h-screen flex flex-col",
      isCollapsed ? "ml-20" : "ml-64"
    )}>
      {children}
    </main>
  );
}
