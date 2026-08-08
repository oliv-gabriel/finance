"use client";

import React, { useState } from "react";
import { Wallet, ArrowUpCircle, ArrowDownCircle, CheckCircle2, Eye, Clock, ChevronDown, ChevronUp } from "lucide-react";

interface DashboardMetricsProps {
  summary: {
    income: number;
    expenses: number;
    balance: number;
    paidExpenses: number;
    pendingExpenses: number;
  };
}

export default function DashboardMetrics({ summary }: DashboardMetricsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  return (
    <div className="space-y-3">
      {/* Botão Expandir */}
      <div className="flex justify-end px-1">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs font-semibold text-[#b300e4] hover:text-[#b300e4]/80 flex items-center gap-1 transition-colors cursor-pointer"
        >
          {isExpanded ? (
            <>
              Ocultar a pagar <ChevronUp className="w-3.5 h-3.5" />
            </>
          ) : (
            <>
              Expandir a pagar <ChevronDown className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 md:gap-4 transition-all duration-300">
        {/* Saldo Geral - Ocupa linha toda no mobile */}
        <div className="col-span-2 lg:col-span-1 bg-card border border-border/70 rounded-2xl p-4 md:p-5 shadow-xs hover:border-border transition-colors relative flex items-center justify-between">
          <div className="flex items-start gap-3.5">
            <div className="size-10 rounded-full bg-[#b300e4]/15 text-[#b300e4] flex items-center justify-center shrink-0 shadow-2xs">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xs font-semibold text-muted-foreground tracking-wide flex items-center gap-1">
                Saldo atual
              </span>
              <div className={`text-xl md:text-2xl lg:text-3xl font-bold tracking-tight mt-1 ${summary.balance >= 0 ? "text-foreground" : "text-red-500"}`}>
                {formatCurrency(summary.balance)}
              </div>
            </div>
          </div>
          <span title="Ocultar valores" className="text-muted-foreground/70 hover:text-foreground cursor-pointer transition-colors shrink-0 mr-1">
            <Eye className="h-5 w-5" />
          </span>
        </div>

        {/* Receitas - Metade no mobile */}
        <div className="col-span-1 bg-card border border-border/70 rounded-2xl p-4 md:p-5 shadow-xs hover:border-border transition-colors flex items-center gap-3">
          <div className="size-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
            <ArrowUpCircle className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-xs font-semibold text-muted-foreground truncate block">Receitas</span>
            <div className="text-base md:text-2xl font-bold tracking-tight text-foreground mt-0.5 truncate">
              {formatCurrency(summary.income)}
            </div>
          </div>
        </div>

        {/* Despesas - Metade no mobile */}
        <div className="col-span-1 bg-card border border-border/70 rounded-2xl p-4 md:p-5 shadow-xs hover:border-border transition-colors flex items-center gap-3">
          <div className="size-10 rounded-xl bg-rose-500/15 text-rose-400 flex items-center justify-center shrink-0">
            <ArrowDownCircle className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-xs font-semibold text-muted-foreground truncate block">Despesas</span>
            <div className="text-base md:text-2xl font-bold tracking-tight text-foreground mt-0.5 truncate">
              {formatCurrency(summary.expenses)}
            </div>
          </div>
        </div>

        {/* Total Pago ou A Pagar dinâmico baseado no layout ou estado */}
        <div className="col-span-2 lg:col-span-1 bg-card border border-border/70 rounded-2xl p-4 md:p-5 shadow-xs hover:border-border transition-colors flex items-center gap-3">
          <div className="size-10 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-xs font-semibold text-muted-foreground truncate block">Total Pago</span>
            <div className="text-xl md:text-2xl font-bold tracking-tight text-foreground mt-0.5 truncate">
              {formatCurrency(summary.paidExpenses)}
            </div>
          </div>
        </div>
        
        {/* Cards Ocultos: A Pagar e Saldo Projetado */}
        {isExpanded && (
          <>
            <div className="col-span-2 lg:col-span-2 bg-card border border-amber-500/30 rounded-2xl p-4 md:p-5 shadow-sm bg-gradient-to-r from-amber-500/5 to-transparent transition-all animate-in fade-in slide-in-from-top-4 flex items-center gap-3">
              <div className="size-10 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
                <Clock className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-xs font-bold text-amber-500/80 uppercase tracking-wider truncate block">A Pagar (Despesas)</span>
                <div className="text-xl md:text-2xl font-black tracking-tight text-amber-500 mt-0.5 truncate">
                  {formatCurrency(summary.pendingExpenses)}
                </div>
              </div>
            </div>

            <div className="col-span-2 lg:col-span-2 bg-card border border-sky-500/30 rounded-2xl p-4 md:p-5 shadow-sm bg-gradient-to-r from-sky-500/5 to-transparent transition-all animate-in fade-in slide-in-from-top-4 flex items-center gap-3">
              <div className="size-10 rounded-xl bg-sky-500/20 text-sky-500 flex items-center justify-center shrink-0">
                <Wallet className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-xs font-bold text-sky-500/80 uppercase tracking-wider truncate block">Saldo Projetado</span>
                <div className={`text-xl md:text-2xl font-black tracking-tight mt-0.5 truncate ${(summary.balance - summary.pendingExpenses) >= 0 ? "text-sky-500" : "text-red-500"}`}>
                  {formatCurrency(summary.balance - summary.pendingExpenses)}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
