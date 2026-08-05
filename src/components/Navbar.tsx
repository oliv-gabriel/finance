"use client";

import { ChevronDown } from "lucide-react";
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
      <div className="flex flex-wrap items-center justify-between md:justify-start min-h-14 px-4 md:px-8 py-2 gap-3 border-b md:border-none border-border/40">
        <DateFilter />
        <SyncEmailsButton />
      </div>
    </header>
  );
}
