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
          <div className="relative">
            <h2 className="text-foreground text-base font-semibold leading-tight">Perfil</h2>
            <div 
              className="flex items-center gap-1 text-xs text-muted-foreground font-medium cursor-pointer hover:text-foreground transition-colors"
              onClick={() => {
                const menu = document.getElementById("profile-menu");
                if (menu) menu.classList.toggle("hidden");
              }}
            >
              <span>Gerenciar Acesso</span>
              <ChevronDown className="h-3 w-3 opacity-70" />
            </div>
            
            {/* Dropdown Menu */}
            <div id="profile-menu" className="hidden absolute top-full left-0 mt-2 w-48 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-xl overflow-hidden z-50">
              <button 
                onClick={async () => {
                  try {
                    const { signIn } = await import("next-auth/react");
                    const res = await signIn("passkey", { action: "register", redirect: false });
                    if (res?.error) {
                      alert("Erro ao cadastrar: " + res.error);
                    } else {
                      alert("Passkey cadastrada com sucesso!");
                    }
                  } catch (e: any) {
                    alert("Erro inesperado: " + e.message);
                  }
                }}
                className="w-full text-left px-4 py-3 text-sm text-white hover:bg-white/5 transition-colors border-b border-white/5 flex items-center gap-2"
              >
                Cadastrar Passkey
              </button>
              <button 
                onClick={async () => {
                  const { signOut } = await import("next-auth/react");
                  signOut({ callbackUrl: "/login" });
                }}
                className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-400/10 transition-colors"
              >
                Sair
              </button>
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
            <Link href={`?${(() => {
              const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
              params.set("newTransaction", "true");
              return params.toString();
            })()}`}>
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
