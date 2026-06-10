"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  ArrowLeftRight, 
  Tags, 
  Wallet, 
  Download,
  Settings,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Landmark
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useSidebar } from "./SidebarProvider";
import { Button } from "./ui/Button";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const menuItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Transações", href: "/transactions", icon: ArrowLeftRight },
  { name: "Contas e Cartões", href: "/accounts", icon: Landmark },
  { name: "Categorias", href: "/categories", icon: Tags },
  { name: "Orçamentos", href: "/budgets", icon: Wallet },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { isCollapsed, toggleSidebar } = useSidebar();

  return (
    <aside className={cn(
      "fixed left-0 top-0 z-40 h-screen border-r bg-background transition-all duration-300 ease-in-out",
      isCollapsed ? "w-20" : "w-64"
    )}>
      <div className="flex h-full flex-col px-3 py-4 relative">
        <div className={cn(
          "mb-10 px-2 flex items-center",
          isCollapsed ? "justify-center" : "justify-between"
        )}>
          {!isCollapsed && <h1 className="text-2xl font-bold text-primary truncate">Financeiro</h1>}
          {isCollapsed && <CircleDollarSign className="h-8 w-8 text-primary" />}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSidebar}
          className="absolute -right-3 top-20 h-6 w-6 rounded-full border bg-background p-0 hover:bg-muted shadow-sm z-50"
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
        
        <nav className="flex-1 space-y-1 font-medium">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                title={isCollapsed ? item.name : undefined}
                className={cn(
                  "flex items-center rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted",
                  isActive ? "bg-muted text-primary" : "text-muted-foreground",
                  isCollapsed && "justify-center px-2"
                )}
              >
                <item.icon className={cn(
                  "h-5 w-5", 
                  !isCollapsed && "mr-3",
                  isActive ? "text-primary" : "text-muted-foreground"
                )} />
                {!isCollapsed && <span className="truncate">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto pt-4 border-t space-y-1">
          <Link
            href="/export"
            title={isCollapsed ? "Exportar Dados" : undefined}
            className={cn(
              "flex items-center rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted",
              isCollapsed && "justify-center px-2"
            )}
          >
            <Download className={cn("h-5 w-5", !isCollapsed && "mr-3")} />
            {!isCollapsed && <span className="truncate">Exportar Dados</span>}
          </Link>
          <Link
            href="/settings"
            title={isCollapsed ? "Configurações" : undefined}
            className={cn(
              "flex items-center rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted",
              isCollapsed && "justify-center px-2"
            )}
          >
            <Settings className={cn("h-5 w-5", !isCollapsed && "mr-3")} />
            {!isCollapsed && <span className="truncate">Configurações</span>}
          </Link>
        </div>
      </div>
    </aside>
  );
}
