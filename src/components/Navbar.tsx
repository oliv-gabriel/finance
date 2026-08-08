"use client";

import { ChevronDown, Plus } from "lucide-react";
import DateFilter from "./DateFilter";
import SyncEmailsButton from "./SyncEmailsButton";
import Link from "next/link";
import { Button } from "./ui/Button";
import { usePathname } from "next/navigation";

interface NavbarProps {
  summary: {
    income: number;
    expenses: number;
    balance: number;
    paidExpenses: number;
  };
}

export default function Navbar({ summary }: NavbarProps) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 w-full bg-[#121212]/95 backdrop-blur supports-[backdrop-filter]:bg-[#121212]/80">
      {/* Mobile Top Header (Perfil e Ações Rápidas) */}
      <div className="md:hidden flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-[#b300e4] text-white flex items-center justify-center font-bold text-lg shadow-sm shadow-[#b300e4]/30">
            J
          </div>
          <div>
            <h2 className="text-foreground text-base font-semibold leading-tight">João</h2>
            <div className="flex items-center gap-1 text-xs text-muted-foreground font-medium cursor-pointer hover:text-foreground transition-colors">
              <span>Perfil Principal</span>
              <ChevronDown className="h-3 w-3 opacity-70" />
            </div>
          </div>
        </div>
      </div>

      {/* Linha de Filtro de Data e Sincronização */}
      <div className="flex items-center justify-between min-h-14 px-4 md:px-8 py-2 border-b md:border-none border-border/40">
        <div className="flex items-center gap-3">
          <DateFilter />
          <SyncEmailsButton />
        </div>
        {!pathname.startsWith("/transactions") && (
          <div className="flex items-center">
            <Link href="/transactions/new">
              <Button className="rounded-full font-bold bg-[#b300e4] hover:bg-[#b300e4]/90 shadow-md shadow-[#b300e4]/20 transition-all text-white cursor-pointer px-4 h-9">
                <Plus className="sm:mr-1.5 h-4 w-4 stroke-[3]" />
                <span className="hidden sm:inline">Nova Transação</span>
              </Button>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
