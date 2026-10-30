"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Calendar, Wallet, CreditCard, Tag, DollarSign, Filter, Check } from "lucide-react";

export interface FilterState {
  status: "all" | "paid" | "unpaid";
  type: "all" | "income" | "expense";
  account: string;
  card: string;
  category: string;
  startDate: string;
  endDate: string;
  amount: string;
  recurrence: "all" | "installments" | "single";
}

export const initialFilterState: FilterState = {
  status: "all",
  type: "all",
  account: "all",
  card: "all",
  category: "all",
  startDate: "",
  endDate: "",
  amount: "",
  recurrence: "all",
};

interface TransactionFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  onReset: () => void;
  resultCount: number;
  accounts: { id: string; name: string; type?: string }[];
  creditCards: { id: string; name: string }[];
  categories: { name: string; color?: string; icon?: string }[];
}

export default function TransactionFilterModal({
  isOpen,
  onClose,
  filters,
  onFilterChange,
  onReset,
  resultCount,
  accounts,
  creditCards,
  categories,
}: TransactionFilterModalProps) {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"detalhes" | "categorias">("detalhes");

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fecha com tecla ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!mounted || !isOpen) return null;

  const update = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const pillClass = (isActive: boolean) =>
    isActive
      ? "bg-white text-zinc-950 font-bold px-4 py-2 rounded-full text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5 scale-[1.02]"
      : "bg-muted border border-border text-muted-foreground font-medium px-4 py-2 rounded-full text-xs hover:border-border/80 hover:text-foreground transition-all cursor-pointer flex items-center gap-1.5";

  // Prepara lista única de contas e cartões
  const contaList = accounts.filter((a) => a.type === "CONTA" || !a.type);
  const cardList = creditCards.length > 0 ? creditCards : accounts.filter((a) => a.type === "CARTAO");

  const modalContent = (
    <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in-0 duration-200">
      <div
        className="w-full max-w-lg bg-card border border-border rounded-t-[32px] sm:rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col max-h-[90vh] text-foreground animate-in slide-in-from-bottom duration-300 sm:duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Barra puxador no mobile */}
        <div className="w-12 h-1.5 bg-zinc-700/80 rounded-full mx-auto mb-3 shrink-0 sm:hidden" />

        {/* Topo: Título e Limpar */}
        <div className="flex items-center justify-between pb-3 border-b border-border/40 shrink-0">
          <h2 className="text-base sm:text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#d246f8]" />
            Filtrar transações
          </h2>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onReset}
              className="text-xs font-semibold text-zinc-400 hover:text-foreground transition-colors cursor-pointer px-2 py-1 rounded-md hover:bg-white/5"
            >
              Limpar
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-zinc-500 hover:text-foreground transition-colors cursor-pointer p-1 rounded-md"
              title="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Abas */}
        <div className="flex items-center gap-6 pt-3 border-b border-border shrink-0 text-xs sm:text-sm">
          <button
            type="button"
            onClick={() => setActiveTab("detalhes")}
            className={`pb-2.5 transition-all cursor-pointer relative ${
              activeTab === "detalhes"
                ? "text-foreground font-bold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-white"
                : "text-zinc-400 hover:text-zinc-200 font-medium"
            }`}
          >
            Detalhes
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("categorias")}
            className={`pb-2.5 transition-all cursor-pointer relative ${
              activeTab === "categorias"
                ? "text-foreground font-bold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-white"
                : "text-zinc-400 hover:text-zinc-200 font-medium"
            }`}
          >
            Categorias
          </button>
        </div>

        {/* Conteúdo rolável */}
        <div className="overflow-y-auto space-y-5 py-4 pr-1 flex-1 text-xs">
          {activeTab === "detalhes" && (
            <>
              {/* Status */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-2">
                  Status
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => update("status", "all")}
                    className={pillClass(filters.status === "all")}
                  >
                    Todos
                  </button>
                  <button
                    type="button"
                    onClick={() => update("status", "paid")}
                    className={pillClass(filters.status === "paid")}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    Pago
                  </button>
                  <button
                    type="button"
                    onClick={() => update("status", "unpaid")}
                    className={pillClass(filters.status === "unpaid")}
                  >
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    Não pago
                  </button>
                </div>
              </div>

              {/* Tipo */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-2">
                  Tipo
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => update("type", "all")}
                    className={pillClass(filters.type === "all")}
                  >
                    Todos
                  </button>
                  <button
                    type="button"
                    onClick={() => update("type", "expense")}
                    className={pillClass(filters.type === "expense")}
                  >
                    Despesa
                  </button>
                  <button
                    type="button"
                    onClick={() => update("type", "income")}
                    className={pillClass(filters.type === "income")}
                  >
                    Receita
                  </button>
                </div>
              </div>

              {/* Contas */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-2">
                  Contas
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => update("account", "all")}
                    className={pillClass(filters.account === "all")}
                  >
                    Todos
                  </button>
                  {contaList.map((acc) => (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => update("account", filters.account === acc.name ? "all" : acc.name)}
                      className={pillClass(filters.account === acc.name)}
                    >
                      <Wallet className="w-3.5 h-3.5 text-zinc-400" />
                      {acc.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cartões */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-2">
                  Cartões
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => update("card", "all")}
                    className={pillClass(filters.card === "all")}
                  >
                    Todos
                  </button>
                  {cardList.map((card) => (
                    <button
                      key={card.id}
                      type="button"
                      onClick={() => update("card", filters.card === card.name ? "all" : card.name)}
                      className={pillClass(filters.card === card.name)}
                    >
                      <CreditCard className="w-3.5 h-3.5 text-zinc-400" />
                      {card.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Data */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-2">
                  Período da Data
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="relative">
                    <span className="block text-[10px] text-zinc-500 mb-1">De</span>
                    <div className="relative">
                      <Calendar className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
                      <input
                        type="date"
                        value={filters.startDate}
                        onChange={(e) => update("startDate", e.target.value)}
                        className="w-full h-9 bg-zinc-900 border border-border rounded-xl pl-9 pr-2 text-xs text-foreground focus:outline-none focus:border-[#b300e4] cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="relative">
                    <span className="block text-[10px] text-zinc-500 mb-1">Até</span>
                    <div className="relative">
                      <Calendar className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
                      <input
                        type="date"
                        value={filters.endDate}
                        onChange={(e) => update("endDate", e.target.value)}
                        className="w-full h-9 bg-zinc-900 border border-border rounded-xl pl-9 pr-2 text-xs text-foreground focus:outline-none focus:border-[#b300e4] cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
                {(filters.startDate || filters.endDate) && (
                  <button
                    type="button"
                    onClick={() => {
                      update("startDate", "");
                      update("endDate", "");
                    }}
                    className="text-[11px] text-[#d246f8] hover:underline mt-1.5 inline-block cursor-pointer"
                  >
                    Limpar período de datas
                  </button>
                )}
              </div>

              {/* Valor */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-2">
                  Valor
                </label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
                  <input
                    type="number"
                    step="any"
                    value={filters.amount}
                    onChange={(e) => update("amount", e.target.value)}
                    placeholder="Insira um valor (R$)"
                    className="w-full h-10 bg-zinc-900 border border-border rounded-xl pl-9 pr-3 text-xs text-foreground placeholder:text-zinc-500 focus:outline-none focus:border-[#b300e4]"
                  />
                  {filters.amount && (
                    <button
                      type="button"
                      onClick={() => update("amount", "")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-foreground"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </>
          )}

          {activeTab === "categorias" && (
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-zinc-300">
                Filtrar por Categoria
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => update("category", "all")}
                  className={pillClass(filters.category === "all")}
                >
                  Todas as Categorias
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.name}
                    type="button"
                    onClick={() => update("category", filters.category === cat.name ? "all" : cat.name)}
                    className={pillClass(filters.category === cat.name)}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: cat.color || "#b300e4" }}
                    />
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Rodapé: Botão Ver Resultados */}
        <div className="pt-3 border-t border-border/40 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 bg-white hover:bg-zinc-200 text-zinc-950 font-extrabold rounded-full transition-all text-xs sm:text-sm shadow-md cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Ver resultados</span>
            <span className="text-zinc-500 font-semibold">({resultCount})</span>
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
