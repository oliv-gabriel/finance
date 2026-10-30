"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  Home, 
  List, 
  Plus, 
  Landmark,
  Tags
} from "lucide-react";

export default function MobileNav() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-18 bg-card/95 backdrop-blur-md border-t border-border z-50 flex items-center justify-around px-2 pb-safe shadow-xl">
      {/* 1. Home */}
      <Link 
        href="/"
        aria-label="Ir para o Início"
        className={`flex flex-col items-center justify-center p-2 rounded-xl transition-colors duration-200 ${
          pathname === "/" ? "text-[#b300e4] font-semibold" : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <Home className="h-6 w-6 stroke-[2.2]" />
      </Link>

      {/* 2. Transações / Extrato */}
      <Link 
        href="/transactions"
        aria-label="Ir para Transações"
        className={`flex flex-col items-center justify-center p-2 rounded-xl transition-colors duration-200 ${
          pathname === "/" ? "text-muted-foreground hover:text-foreground" : pathname === "/transactions" ? "text-[#b300e4] font-semibold" : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <List className="h-6 w-6 stroke-[2.2]" />
      </Link>

      {/* 3. Botão Central Flutuante (+) */}
      <button
        type="button"
        aria-label="Nova transação"
        onClick={() => {
          const params = new URLSearchParams(window.location.search);
          params.set("newTransaction", "true");
          router.push(`?${params.toString()}`);
        }}
        className="w-12 h-12 rounded-2xl bg-[#b300e4] hover:bg-[#9a00c4] text-white flex items-center justify-center -translate-y-2 shadow-lg shadow-[#b300e4]/30 transition-transform active:scale-95 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b300e4] focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        title="Nova transação"
      >
        <Plus className="h-7 w-7 stroke-[2.5] text-white" />
      </button>

      {/* 4. Categorias */}
      <Link 
        href="/categories"
        aria-label="Ir para Categorias"
        className={`flex flex-col items-center justify-center p-2 rounded-xl transition-colors duration-200 ${
          pathname === "/categories" ? "text-[#b300e4] font-semibold" : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <Tags className="h-6 w-6 stroke-[2.2]" />
      </Link>

      {/* 5. Contas e Cartões */}
      <Link 
        href="/accounts"
        aria-label="Ir para Contas e Cartões"
        className={`flex flex-col items-center justify-center p-2 rounded-xl transition-colors duration-200 ${
          pathname === "/accounts" ? "text-[#b300e4] font-semibold" : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <Landmark className="h-6 w-6 stroke-[2.2]" />
      </Link>
    </nav>
  );
}
