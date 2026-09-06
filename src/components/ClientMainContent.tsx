"use client";

import { useSidebar } from "./SidebarProvider";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import MobileNav from "./MobileNav";
import TransactionSlideOver from "./transactions/TransactionSlideOver";
import { Suspense } from "react";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function ClientMainContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar();

  return (
    <main className={cn(
      "flex min-h-screen min-w-0 flex-1 flex-col pb-22 transition-all duration-300 md:pb-0",
      isCollapsed ? "md:ml-20" : "md:ml-64"
    )}>
      {children}
      <MobileNav />
      <Suspense fallback={null}>
        <TransactionSlideOver />
      </Suspense>
    </main>
  );
}
