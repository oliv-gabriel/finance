"use client";

import React, { useState, useTransition } from "react";
import { Landmark, CreditCard, Trash2, FileText, Check, Plus, AlertCircle } from "lucide-react";
import { getBankIcon, getBankStyle } from "@/lib/icons";
import { toggleAccountIncludeInTotal, deleteAccount } from "@/app/actions/accounts";
import CardInvoiceModal from "./CardInvoiceModal";
import { useRouter } from "next/navigation";

export interface AccountItemData {
  id: string;
  name: string;
  type: string;
  includeInTotal: boolean;
  limit?: number | null;
  closingDay?: number | null;
  dueDay?: number | null;
  bank?: { id: string; name: string } | null;
}

interface AccountsListProps {
  bankAccounts: AccountItemData[];
  creditCards: AccountItemData[];
  month: number;
  year: number;
  onOpenNewAccount?: () => void;
}

export default function AccountsList({
  bankAccounts,
  creditCards,
  month,
  year,
  onOpenNewAccount,
}: AccountsListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  // Optimistic tracking for includeInTotal switches
  const [includeMap, setIncludeMap] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const acc of [...bankAccounts, ...creditCards]) {
      initial[acc.id] = acc.includeInTotal !== false;
    }
    return initial;
  });

  // Keep in sync when props change
  React.useEffect(() => {
    const next: Record<string, boolean> = {};
    for (const acc of [...bankAccounts, ...creditCards]) {
      next[acc.id] = acc.includeInTotal !== false;
    }
    setIncludeMap(next);
  }, [bankAccounts, creditCards]);

  const handleToggle = (id: string, currentVal: boolean) => {
    const nextVal = !currentVal;
    setIncludeMap((prev) => ({ ...prev, [id]: nextVal }));

    startTransition(async () => {
      const res = await toggleAccountIncludeInTotal(id, nextVal);
      if (!res.success) {
        setIncludeMap((prev) => ({ ...prev, [id]: currentVal }));
        alert(res.error || "Falha ao alterar configuração da conta");
      } else {
        router.refresh();
      }
    });
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Deseja realmente excluir "${name}"?`)) {
      startTransition(async () => {
        const res = await deleteAccount(id);
        if (!res.success) {
          alert(res.error || "Falha ao excluir conta. Verifique se existem transações vinculadas.");
        } else {
          router.refresh();
        }
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Grid com Contas Bancárias e Cartões de Crédito */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* SEÇÃO 1: CONTAS BANCÁRIAS */}
        <div className="bg-[#18181b] border border-white/10 rounded-2xl p-4 md:p-6 shadow-sm flex flex-col">
          {/* Header da Seção */}
          <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-white/5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                <Landmark className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white tracking-tight">Contas Bancárias</h2>
                <p className="text-xs text-zinc-400">{bankAccounts.length} {bankAccounts.length === 1 ? "conta cadastrada" : "contas cadastradas"}</p>
              </div>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/5 text-zinc-300 border border-white/10">
              {bankAccounts.length}
            </span>
          </div>

          {/* Lista de Contas */}
          {bankAccounts.length === 0 ? (
            <div className="py-10 text-center flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-2xl bg-zinc-800/80 border border-white/5 flex items-center justify-center text-zinc-500 mb-3">
                <Landmark className="h-6 w-6" />
              </div>
              <p className="text-sm font-medium text-zinc-300">Nenhuma conta cadastrada</p>
              <p className="text-xs text-zinc-500 mt-1 max-w-xs">Cadastre suas contas bancárias para organizar seus saldos e transferências.</p>
              {onOpenNewAccount && (
                <button
                  type="button"
                  onClick={onOpenNewAccount}
                  className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-[#b300e4] hover:bg-[#b300e4]/90 text-white shadow-md shadow-[#b300e4]/20 transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  Adicionar Conta
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {bankAccounts.map((account) => {
                const isIncluded = includeMap[account.id] ?? (account.includeInTotal !== false);
                const bankStyle = getBankStyle(account.name);
                const bankIcon = getBankIcon(account.name);

                return (
                  <div
                    key={account.id}
                    className="group bg-[#141417] hover:bg-[#1a1a1f] border border-white/5 hover:border-white/10 rounded-2xl p-3.5 transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                  >
                    {/* Lado Esquerdo: Ícone do Banco + Dados */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center p-2 shrink-0 border transition-transform duration-200 group-hover:scale-105"
                        style={{
                          backgroundColor: `${bankStyle.color}15`,
                          borderColor: bankStyle.borderColor,
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={bankIcon}
                          alt={account.name}
                          className="w-7 h-7 object-contain rounded-xs"
                          loading="lazy"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm md:text-base font-bold text-white truncate leading-tight">
                          {account.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[11px] font-medium text-zinc-400">
                            Conta Bancária
                          </span>
                          <span className="text-[10px] text-zinc-600">•</span>
                          <span className={`text-[11px] font-medium ${isIncluded ? "text-emerald-400" : "text-zinc-500"}`}>
                            {isIncluded ? "Ativa no total" : "Oculta do total"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Lado Direito: Ações (Toggle Switch Roxo + Lixeira) */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
                      {/* Toggle Switch Roxo */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-zinc-400 select-none">
                          {isIncluded ? "No saldo" : "Oculto"}
                        </span>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={isIncluded}
                          disabled={isPending}
                          onClick={() => handleToggle(account.id, isIncluded)}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            isIncluded ? "bg-[#b300e4]" : "bg-zinc-700"
                          } ${isPending ? "opacity-60" : ""}`}
                          title={isIncluded ? "Incluído no saldo do dashboard (clique para ocultar)" : "Oculto do saldo do dashboard (clique para incluir)"}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                              isIncluded ? "translate-x-5" : "translate-x-0"
                            }`}
                          />
                        </button>
                      </div>

                      {/* Excluir Conta */}
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleDelete(account.id, account.name)}
                        title="Excluir conta"
                        className="text-zinc-500 hover:text-red-400 p-2 hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* SEÇÃO 2: CARTÕES DE CRÉDITO */}
        <div className="bg-[#18181b] border border-white/10 rounded-2xl p-4 md:p-6 shadow-sm flex flex-col">
          {/* Header da Seção */}
          <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-white/5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                <CreditCard className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white tracking-tight">Cartões de Crédito</h2>
                <p className="text-xs text-zinc-400">{creditCards.length} {creditCards.length === 1 ? "cartão cadastrado" : "cartões cadastrados"}</p>
              </div>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/5 text-zinc-300 border border-white/10">
              {creditCards.length}
            </span>
          </div>

          {/* Lista de Cartões */}
          {creditCards.length === 0 ? (
            <div className="py-10 text-center flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-2xl bg-zinc-800/80 border border-white/5 flex items-center justify-center text-zinc-500 mb-3">
                <CreditCard className="h-6 w-6" />
              </div>
              <p className="text-sm font-medium text-zinc-300">Nenhum cartão cadastrado</p>
              <p className="text-xs text-zinc-500 mt-1 max-w-xs">Cadastre seus cartões de crédito para controlar faturas, limites e vencimentos.</p>
              {onOpenNewAccount && (
                <button
                  type="button"
                  onClick={onOpenNewAccount}
                  className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-[#b300e4] hover:bg-[#b300e4]/90 text-white shadow-md shadow-[#b300e4]/20 transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  Adicionar Cartão
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {creditCards.map((card) => {
                const isIncluded = includeMap[card.id] ?? (card.includeInTotal !== false);
                const bankStyle = getBankStyle(card.name);
                const bankIcon = getBankIcon(card.name);

                return (
                  <div
                    key={card.id}
                    className="group bg-[#141417] hover:bg-[#1a1a1f] border border-white/5 hover:border-white/10 rounded-2xl p-3.5 transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                  >
                    {/* Lado Esquerdo: Ícone + Dados do Cartão */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center p-2 shrink-0 border transition-transform duration-200 group-hover:scale-105"
                        style={{
                          backgroundColor: `${bankStyle.color}15`,
                          borderColor: bankStyle.borderColor,
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={bankIcon}
                          alt={card.name}
                          className="w-7 h-7 object-contain rounded-xs"
                          loading="lazy"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm md:text-base font-bold text-white truncate leading-tight">
                            {card.name}
                          </h3>
                          {card.bank && (
                            <span className="text-[10px] bg-white/5 border border-white/10 text-zinc-400 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                              <Landmark className="h-2.5 w-2.5" />
                              {card.bank.name}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1 flex-wrap text-xs text-zinc-400">
                          {card.limit != null && card.limit > 0 && (
                            <span className="text-zinc-300 font-medium">
                              Limite: R$ {card.limit.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                            </span>
                          )}
                          {(card.closingDay || card.dueDay) && (
                            <span className="text-zinc-500">
                              • Fecha {card.closingDay || "-"} / Vence {card.dueDay || "-"}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Lado Direito: Ações (Fatura + Toggle Switch + Lixeira) */}
                    <div className="flex items-center justify-between sm:justify-end gap-2.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
                      {/* Botão Ver Fatura */}
                      <button
                        type="button"
                        onClick={() => setSelectedCardId(card.id)}
                        className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-200 border border-white/10 hover:border-white/20 transition-all cursor-pointer"
                        title="Ver detalhes da fatura deste cartão"
                      >
                        <FileText className="w-3.5 h-3.5 text-[#b300e4]" />
                        <span>Fatura</span>
                      </button>

                      {/* Toggle Switch Roxo */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={isIncluded}
                          disabled={isPending}
                          onClick={() => handleToggle(card.id, isIncluded)}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            isIncluded ? "bg-[#b300e4]" : "bg-zinc-700"
                          } ${isPending ? "opacity-60" : ""}`}
                          title={isIncluded ? "Fatura incluída nas despesas do dashboard" : "Fatura oculta das despesas do dashboard"}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                              isIncluded ? "translate-x-5" : "translate-x-0"
                            }`}
                          />
                        </button>
                      </div>

                      {/* Excluir Cartão */}
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleDelete(card.id, card.name)}
                        title="Excluir cartão"
                        className="text-zinc-500 hover:text-red-400 p-2 hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Fatura do Cartão */}
      <CardInvoiceModal
        isOpen={!!selectedCardId}
        onClose={() => setSelectedCardId(null)}
        cardId={selectedCardId}
        initialMonth={month}
        initialYear={year}
      />
    </div>
  );
}

