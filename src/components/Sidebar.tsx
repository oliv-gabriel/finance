"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  ArrowLeftRight, 
  Tags, 
  Download, 
  CircleDollarSign, 
  Landmark, 
  LogOut
} from "lucide-react";
import { useSidebar } from "./SidebarProvider";
import { cn } from "@/lib/utils";
import { signOut } from "next-auth/react";
import { getLoggedUserInfo } from "@/app/actions/authActions";

const menuItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Transações", href: "/transactions", icon: ArrowLeftRight },
  { name: "Contas e Cartões", href: "/accounts", icon: Landmark },
  { name: "Categorias", href: "/categories", icon: Tags },
];

export default function Sidebar({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname();
  const { isCollapsed, setIsCollapsed } = useSidebar();
  const [isAdminState, setIsAdminState] = useState(isAdmin);
  const [userInfo, setUserInfo] = useState<{
    name: string;
    role: string;
    isAdmin: boolean;
  } | null>(null);

  useEffect(() => {
    if (isAdmin) {
      setIsAdminState(true);
    }
  }, [isAdmin]);

  useEffect(() => {
    let isMounted = true;
    getLoggedUserInfo().then((info) => {
      if (!isMounted || !info) return;
      setUserInfo({
        name: info.name,
        role: info.role,
        isAdmin: info.isAdmin,
      });
      if (info.isAdmin) {
        setIsAdminState(true);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [pathname]);

  return (
    <aside 
      onMouseEnter={() => setIsCollapsed(false)}
      onMouseLeave={() => setIsCollapsed(true)}
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-[#121212] transition-all duration-300 ease-in-out hidden md:block border-r border-white/5",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      <div className="flex h-full flex-col px-3 py-4 relative">
        <div className={cn(
          "mb-8 px-2 flex items-center",
          isCollapsed ? "justify-center" : "justify-between"
        )}>
          {!isCollapsed && <h1 className="text-2xl font-extrabold tracking-tight text-[#b300e4] truncate">Financeiro</h1>}
          {isCollapsed && <CircleDollarSign className="h-8 w-8 text-[#b300e4]" />}
        </div>
        
        <nav className="flex-1 space-y-1 font-medium">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                title={isCollapsed ? item.name : undefined}
                className={cn(
                  "flex items-center rounded-xl px-3 py-2.5 text-sm transition-all duration-200",
                  isActive ? "bg-[#b300e4]/15 text-[#b300e4] font-bold shadow-2xs border border-[#b300e4]/20" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                  isCollapsed && "justify-center px-2"
                )}
              >
                <item.icon className={cn(
                  "h-5 w-5 transition-transform duration-200 group-hover:scale-105", 
                  !isCollapsed && "mr-3",
                  isActive ? "text-[#b300e4]" : "text-muted-foreground"
                )} />
                {!isCollapsed && <span className="truncate">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto pt-4 space-y-1">
          <Link
            href="/export"
            title={isCollapsed ? "Exportar Dados" : undefined}
            className={cn(
              "flex items-center rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground",
              isCollapsed && "justify-center px-2"
            )}
          >
            <Download className={cn("h-5 w-5", !isCollapsed && "mr-3")} />
            {!isCollapsed && <span className="truncate">Exportar Dados</span>}
          </Link>

          {/* Link para Meu Perfil */}
          {userInfo && (
            <Link
              href="/profile"
              title={isCollapsed ? `${userInfo.name} (Meu Perfil)` : undefined}
              className={cn(
                "flex items-center gap-2.5 rounded-xl p-2 transition-all mt-2",
                pathname === "/profile"
                  ? "bg-white/10 text-white font-medium shadow-2xs border border-white/10"
                  : "text-zinc-400 hover:text-white hover:bg-white/[0.04]",
                isCollapsed && "justify-center px-1"
              )}
            >
              <div className="w-8 h-8 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-xs font-semibold text-zinc-200 shrink-0 uppercase">
                {userInfo.name ? userInfo.name.slice(0, 1) : "U"}
              </div>
              {!isCollapsed && (
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-zinc-200 truncate leading-tight">
                    {userInfo.name}
                  </p>
                  <p className="text-[11px] text-zinc-500 font-medium truncate leading-tight mt-0.5">
                    {userInfo.isAdmin ? "Administrador" : "Normal"}
                  </p>
                </div>
              )}
            </Link>
          )}

          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            title={isCollapsed ? "Sair" : undefined}
            className={cn(
              "w-full flex items-center rounded-xl px-3 py-2 text-sm font-medium text-zinc-500 hover:text-zinc-300 transition-colors hover:bg-muted/60",
              isCollapsed && "justify-center px-2"
            )}
          >
            <LogOut className={cn("h-4 w-4", !isCollapsed && "mr-3")} />
            {!isCollapsed && <span className="truncate">Sair</span>}
          </button>
        </div>
      </div>
    </aside>
  );
}
