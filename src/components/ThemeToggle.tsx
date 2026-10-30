"use client";

import React, { useEffect, useState } from "react";
import { Sun, Moon, Laptop } from "lucide-react";
import { useTheme, Theme } from "./ThemeProvider";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  variant?: "icon" | "segmented" | "menu-item";
  className?: string;
}

export default function ThemeToggle({ variant = "icon", className }: ThemeToggleProps) {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    if (variant === "segmented") {
      return (
        <div className={cn("grid grid-cols-3 gap-1.5 p-1 bg-muted rounded-xl border border-border animate-pulse", className)}>
          <div className="h-9 rounded-lg bg-card/50" />
          <div className="h-9 rounded-lg bg-card/50" />
          <div className="h-9 rounded-lg bg-card/50" />
        </div>
      );
    }
    return (
      <div 
        className={cn(
          "w-9 h-9 rounded-xl border border-border bg-card/50 text-muted-foreground flex items-center justify-center animate-pulse",
          className
        )}
      />
    );
  }

  if (variant === "segmented") {
    const options: { value: Theme; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
      { value: "light", label: "Claro", icon: Sun },
      { value: "dark", label: "Escuro", icon: Moon },
      { value: "system", label: "Sistema", icon: Laptop },
    ];

    return (
      <div className={cn("grid grid-cols-3 gap-1.5 p-1 bg-muted rounded-xl border border-border", className)}>
        {options.map((opt) => {
          const Icon = opt.icon;
          const isActive = theme === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setTheme(opt.value)}
              className={cn(
                "flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-[color,background-color,border-color,box-shadow] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b300e4]",
                isActive
                  ? "bg-card text-foreground shadow-xs border border-border font-bold"
                  : "text-muted-foreground hover:text-foreground hover:bg-card/40"
              )}
              aria-label={`Selecionar tema ${opt.label}`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  if (variant === "menu-item") {
    const isDark = resolvedTheme === "dark";
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={cn(
          "w-full flex items-center justify-between px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b300e4]",
          className
        )}
        aria-label={isDark ? "Mudar para modo claro" : "Mudar para modo escuro"}
      >
        <span className="flex items-center gap-2.5">
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-[#b300e4]" />}
          <span>{isDark ? "Modo Claro" : "Modo Escuro"}</span>
        </span>
        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
          {isDark ? "Ativar" : "Ativar"}
        </span>
      </button>
    );
  }

  // Default: variant === "icon"
  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        "relative size-9 rounded-xl border border-border bg-card hover:bg-muted/80 text-foreground flex items-center justify-center shadow-2xs transition-[color,background-color,border-color] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b300e4]",
        className
      )}
      title={isDark ? "Mudar para modo claro" : "Mudar para modo escuro"}
      aria-label={isDark ? "Mudar para modo claro" : "Mudar para modo escuro"}
    >
      <Sun 
        className={cn(
          "h-4 w-4 transition-[transform,opacity] duration-300 text-amber-500",
          isDark ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0 absolute"
        )} 
      />
      <Moon 
        className={cn(
          "h-4 w-4 transition-[transform,opacity] duration-300 text-[#b300e4]",
          isDark ? "rotate-90 scale-0 opacity-0 absolute" : "rotate-0 scale-100 opacity-100"
        )} 
      />
    </button>
  );
}

