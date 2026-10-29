"use client";

import { useState, useEffect } from "react";
import { ChevronDown, Plus, Crown } from "lucide-react";
import DateFilter from "./DateFilter";
import SyncEmailsButton from "./SyncEmailsButton";
import Link from "next/link";
import { Button } from "./ui/Button";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { getLoggedUserInfo } from "@/app/actions/authActions";

interface NavbarProps {
  summary?: {
    income: number;
    expenses: number;
    balance: number;
    paidExpenses: number;
  };
  isAdmin?: boolean;
}

export default function Navbar({ summary, isAdmin = false }: NavbarProps = {}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAdminState, setIsAdminState] = useState(isAdmin);
  const [user, setUser] = useState<{ name: string; isAdmin: boolean } | null>(null);

  useEffect(() => {
    if (isAdmin) {
      setIsAdminState(true);
    }
  }, [isAdmin]);

  useEffect(() => {
    let isMounted = true;
    getLoggedUserInfo().then((info) => {
      if (!isMounted || !info) return;
      setUser({ name: info.name, isAdmin: info.isAdmin });
      if (info.isAdmin) {
        setIsAdminState(true);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [pathname]);

  return (
    <header className="sticky top-0 z-30 w-full bg-[#121212]/95 backdrop-blur supports-[backdrop-filter]:bg-[#121212]/80">
      {/* Mobile Top Header (Perfil e Ações Rápidas) */}
      <div className="md:hidden flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-zinc-800 border border-white/10 text-zinc-200 flex items-center justify-center font-medium text-sm">
            {user?.name ? user.name.slice(0, 1).toUpperCase() : "U"}
          </div>
          <div className="relative">
            <div className="flex items-center gap-1.5">
              <h2 className="text-foreground text-sm font-medium leading-tight">
                {user?.name || "Usuário"}
              </h2>
              {isAdminState && (
                <span className="text-[10px] text-zinc-400 bg-white/5 border border-white/10 px-1.5 py-0.5 rounded font-medium">
                  Admin
                </span>
              )}
            </div>
            <div 
              className="flex items-center gap-1 text-xs text-muted-foreground font-medium cursor-pointer hover:text-foreground transition-colors mt-0.5"
              onClick={() => {
                const menu = document.getElementById("profile-menu");
                if (menu) menu.classList.toggle("hidden");
              }}
            >
              <span>Gerenciar Conta</span>
              <ChevronDown className="h-3 w-3 opacity-70" />
            </div>
            
            {/* Dropdown Menu */}
            <div id="profile-menu" className="hidden absolute top-full left-0 mt-2 w-44 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-xl overflow-hidden z-50">
              <Link
                href="/profile"
                className="block w-full text-left px-4 py-2.5 text-sm text-zinc-200 hover:bg-white/5 transition-colors border-b border-white/5"
              >
                Meu Perfil
              </Link>
              <button 
                onClick={async () => {
                  signOut({ callbackUrl: "/login" });
                }}
                className="w-full text-left px-4 py-2.5 text-sm text-zinc-400 hover:text-zinc-200 hover:bg-white/5 transition-colors"
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
          {isAdminState && <SyncEmailsButton />}
        </div>
        {!pathname.startsWith("/transactions") && (
          <div className="flex items-center">
            <Button 
              onClick={() => {
                const params = new URLSearchParams(window.location.search);
                params.set("newTransaction", "true");
                router.push(`?${params.toString()}`);
              }}
              className="rounded-full font-bold bg-[#b300e4] hover:bg-[#b300e4]/90 shadow-md shadow-[#b300e4]/20 transition-all text-white cursor-pointer px-4 h-9"
            >
              <Plus className="sm:mr-1.5 h-4 w-4 stroke-[3]" />
              <span className="hidden sm:inline">Nova Transação</span>
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
