"use client";

import { Wallet, ArrowUpCircle, ArrowDownCircle, CheckCircle2 } from "lucide-react";
import DateFilter from "./DateFilter";
import SyncEmailsButton from "./SyncEmailsButton";

interface NavbarProps {
  summary: {
    income: number;
    expenses: number;
    balance: number;
    paidExpenses: number;
  };
}

export default function Navbar({ summary }: NavbarProps) {
  return (
    <header className="sticky top-0 z-30 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center px-8 gap-4">
        <DateFilter />
        <SyncEmailsButton />
      </div>
    </header>
  );
}
