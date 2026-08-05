"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  Home, 
  List, 
  Plus, 
  BarChart3, 
  User, 
  Landmark,
  Tags
} from "lucide-react";

export default function MobileNav() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-18 bg-[#121212]/95 backdrop-blur-md border-t border-border/60 z-50 flex items-center justify-around px-2 pb-safe shadow-xl">
      {/* 1. Home */}
      <Link 
        href="/"
        className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 ${
          pathname === "/" ? "text-[#b300e4] font-semibold" : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <Home className="h-6 w-6 stroke-[2.2]" />
      </Link>

      {/* 2. Transações / Extrato */}
      <Link 
        href="/transactions"
        className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 ${
          pathname === "/transactions" ? "text-[#b300e4] font-semibold" : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <List className="h-6 w-6 stroke-[2.2]" />
      </Link>

      {/* 3. Botão Central Flutuante (+) */}
      <Link
        href="/transactions"
        className="w-12 h-12 rounded-2xl bg-[#b300e4] hover:bg-[#b300e4]/90 text-white flex items-center justify-center -translate-y-2 shadow-lg shadow-[#b300e4]/30 transition-transform active:scale-95 cursor-pointer"
        title="Nova transação"
      >
        <Plus className="h-7 w-7 stroke-[2.5] text-white" />
      </Link>

      {/* 4. Orçamentos / Gráficos */}
      <Link 
        href="/budgets"
        className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 ${
          pathname === "/budgets" ? "text-[#b300e4] font-semibold" : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <BarChart3 className="h-6 w-6 stroke-[2.2]" />
      </Link>

      {/* 5. Contas e Cartões / Perfil */}
      <Link 
        href="/accounts"
        className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 ${
          pathname === "/accounts" ? "text-[#b300e4] font-semibold" : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <Landmark className="h-6 w-6 stroke-[2.2]" />
      </Link>
    </nav>
  );
}
