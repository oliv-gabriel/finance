"use client";

import { useSidebar } from "./SidebarProvider";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import MobileNav from "./MobileNav";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function ClientMainContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar();

  return (
    <main className={cn(
      "flex-1 transition-all duration-300 min-h-screen flex flex-col w-full pb-22 md:pb-0",
      isCollapsed ? "md:ml-20" : "md:ml-64"
    )}>
      {children}
      <MobileNav />
    </main>
  );
}
