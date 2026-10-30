"use client";

import React, { useState, useTransition } from "react";
import { Landmark, CreditCard, Trash2, FileText, Pencil, X, Loader2, Plus, Info } from "lucide-react";
import { getBankIcon, getBankStyle } from "@/lib/icons";
import { toggleAccountIncludeInTotal, deleteAccount, updateAccount } from "@/app/actions/accounts";
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
  bankId?: string | null;
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
  const [editingAccount, setEditingAccount] = useState<AccountItemData | null>(null);

  // Form states for editing
  const [editName, setEditName] = useState("");
  const [editBankId, setEditBankId] = useState("");
  const [editLimit, setEditLimit] = useState("");
  const [editClosingDay, setEditClosingDay] = useState("");
  const [editDueDay, setEditDueDay] = useState("");
  const [editIncludeInTotal, setEditIncludeInTotal] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const startEdit = (acc: AccountItemData) => {
    setEditingAccount(acc);
    setEditName(acc.name);
    setEditBankId(acc.bankId || acc.bank?.id || "");
    setEditLimit(acc.limit != null ? acc.limit.toString() : "");
    setEditClosingDay(acc.closingDay != null ? acc.closingDay.toString() : "");
    setEditDueDay(acc.dueDay != null ? acc.dueDay.toString() : "");
    setEditIncludeInTotal(acc.includeInTotal !== false);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAccount || !editName.trim()) return;

    if (editingAccount.type === "CARTAO") {
      const cDay = parseInt(editClosingDay);
      const dDay = parseInt(editDueDay);
      if (isNaN(cDay) || cDay < 1 || cDay > 31) {
        alert("O dia de fechamento deve ser um número entre 1 e 31.");
        return;
      }
      if (isNaN(dDay) || dDay < 1 || dDay > 31) {
        alert("O dia de vencimento deve ser um número entre 1 e 31.");
        return;
      }
    }

    setIsSaving(true);
    const res = await updateAccount(editingAccount.id, {
      name: editName.trim(),
      bankId: editingAccount.type === "CARTAO" ? (editBankId ? editBankId : null) : undefined,
      limit: editingAccount.type === "CARTAO" ? (editLimit ? parseFloat(editLimit) : 0) : undefined,
      closingDay: editingAccount.type === "CARTAO" ? (editClosingDay ? parseInt(editClosingDay) : null) : undefined,
      dueDay: editingAccount.type === "CARTAO" ? (editDueDay ? parseInt(editDueDay) : null) : undefined,
      includeInTotal: editIncludeInTotal,
    });
    setIsSaving(false);

    if (!res.success) {
      alert(res.error || "Falha ao atualizar conta");
    } else {
      setEditingAccount(null);
      router.refresh();
    }
  };

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
        <div className="bg-card border border-border rounded-2xl p-4 md:p-6 shadow-sm flex flex-col">
          {/* Header da Seção */}
          <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-border/40">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                <Landmark className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-foreground tracking-tight">Contas Bancárias</h2>
                <p className="text-xs text-muted-foreground">{bankAccounts.length} {bankAccounts.length === 1 ? "conta cadastrada" : "contas cadastradas"}</p>
              </div>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-muted/50 text-foreground border border-border">
              {bankAccounts.length}
            </span>
          </div>

          {/* Lista de Contas */}
          {bankAccounts.length === 0 ? (
            <div className="py-10 text-center flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-2xl bg-muted border border-border/40 flex items-center justify-center text-muted-foreground/80 mb-3">
                <Landmark className="h-6 w-6" />
              </div>
              <p className="text-sm font-medium text-foreground">Nenhuma conta cadastrada</p>
              <p className="text-xs text-muted-foreground/80 mt-1 max-w-xs">Cadastre suas contas bancárias para organizar seus saldos e transferências.</p>
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
                    className="group bg-muted/30 hover:bg-muted/70 border border-border/40 hover:border-border rounded-2xl p-3.5 transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
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
                        <h3 className="text-sm md:text-base font-bold text-foreground truncate leading-tight">
                          {account.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[11px] font-medium text-muted-foreground">
                            Conta Bancária
                          </span>
                          <span className="text-[10px] text-zinc-600">•</span>
                          <span className={`text-[11px] font-medium ${isIncluded ? "text-emerald-400" : "text-muted-foreground/80"}`}>
                            {isIncluded ? "Ativa no total" : "Oculta do total"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Lado Direito: Ações (Toggle Switch Roxo + Editar + Lixeira) */}
                    <div className="flex items-center justify-between sm:justify-end gap-2.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/40">
                      {/* Toggle Switch Roxo */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground select-none">
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

                      {/* Botão Editar Conta */}
                      <button
                        type="button"
                        onClick={() => startEdit(account)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-xl bg-muted/50 hover:bg-muted text-foreground hover:text-white border border-border transition-colors cursor-pointer"
                        title="Editar conta bancária"
                      >
                        <Pencil className="h-3.5 w-3.5 text-[#b300e4]" />
                        <span>Editar</span>
                      </button>

                      {/* Excluir Conta */}
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleDelete(account.id, account.name)}
                        title="Excluir conta"
                        className="text-muted-foreground/80 hover:text-red-400 p-2 hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer"
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
        <div className="bg-card border border-border rounded-2xl p-4 md:p-6 shadow-sm flex flex-col">
          {/* Header da Seção */}
          <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-border/40">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                <CreditCard className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-foreground tracking-tight">Cartões de Crédito</h2>
                <p className="text-xs text-muted-foreground">{creditCards.length} {creditCards.length === 1 ? "cartão cadastrado" : "cartões cadastrados"}</p>
              </div>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-muted/50 text-foreground border border-border">
              {creditCards.length}
            </span>
          </div>

          {/* Lista de Cartões */}
          {creditCards.length === 0 ? (
            <div className="py-10 text-center flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-2xl bg-muted border border-border/40 flex items-center justify-center text-muted-foreground/80 mb-3">
                <CreditCard className="h-6 w-6" />
              </div>
              <p className="text-sm font-medium text-foreground">Nenhum cartão cadastrado</p>
              <p className="text-xs text-muted-foreground/80 mt-1 max-w-xs">Cadastre seus cartões de crédito para controlar faturas, limites e vencimentos.</p>
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
                    className="group bg-muted/30 hover:bg-muted/70 border border-border/40 hover:border-border rounded-2xl p-3.5 transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
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
                          <h3 className="text-sm md:text-base font-bold text-foreground truncate leading-tight">
                            {card.name}
                          </h3>
                          {card.bank && (
                            <span className="text-[10px] bg-muted/50 border border-border text-muted-foreground px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                              <Landmark className="h-2.5 w-2.5" />
                              {card.bank.name}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1 flex-wrap text-xs text-muted-foreground">
                          {card.limit != null && card.limit > 0 && (
                            <span className="text-foreground font-medium">
                              Limite: R$ {card.limit.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                            </span>
                          )}
                          {(card.closingDay || card.dueDay) && (
                            <span className="text-muted-foreground">
                              • Fecha dia {card.closingDay || "-"} / Vence dia {card.dueDay || "-"}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Lado Direito: Ações (Fatura + Toggle Switch + Editar + Lixeira) */}
                    <div className="flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/40">
                      {/* Botão Ver Fatura */}
                      <button
                        type="button"
                        onClick={() => setSelectedCardId(card.id)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-xl bg-muted/50 hover:bg-muted text-foreground border border-border hover:border-border transition-all cursor-pointer"
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

                      {/* Botão Editar Cartão */}
                      <button
                        type="button"
                        onClick={() => startEdit(card)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-xl bg-muted/50 hover:bg-[#b300e4]/15 text-foreground hover:text-white border border-border hover:border-[#b300e4]/30 transition-all cursor-pointer"
                        title="Editar cartão de crédito"
                      >
                        <Pencil className="h-3.5 w-3.5 text-[#b300e4]" />
                        <span>Editar</span>
                      </button>

                      {/* Excluir Cartão */}
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleDelete(card.id, card.name)}
                        title="Excluir cartão"
                        className="text-muted-foreground/80 hover:text-red-400 p-2 hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer"
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

      {/* Modal de Edição de Conta ou Cartão */}
      {editingAccount && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-card border border-border rounded-2xl p-5 md:p-6 w-full max-w-lg shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-border/40">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#b300e4]/10 text-[#b300e4] flex items-center justify-center">
                  <Pencil className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    Editar {editingAccount.type === "CONTA" ? "Conta Bancária" : "Cartão de Crédito"}
                  </h3>
                  <p className="text-xs text-muted-foreground">Altere as informações e salve as alterações</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingAccount(null)}
                className="text-muted-foreground hover:text-white p-1.5 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  {editingAccount.type === "CONTA" ? "Nome da Conta ou Banco" : "Nome do Cartão"}
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl bg-muted/60 border border-border text-white text-sm focus:outline-none focus:border-[#b300e4] focus:ring-1 focus:ring-[#b300e4] transition-all"
                />
              </div>

              {editingAccount.type === "CARTAO" && (
                <div className="space-y-3 pt-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">Vincular a uma Conta</label>
                      <select
                        value={editBankId}
                        onChange={(e) => setEditBankId(e.target.value)}
                        className="w-full h-11 px-3 rounded-xl bg-muted/60 border border-border text-white text-sm focus:outline-none focus:border-[#b300e4] focus:ring-1 focus:ring-[#b300e4] transition-all cursor-pointer"
                      >
                        <option value="" className="bg-muted/60 text-muted-foreground">Nenhuma (Avulso)</option>
                        {bankAccounts.map((b) => (
                          <option key={b.id} value={b.id} className="bg-muted/60 text-white">
                            {b.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">Limite Total (R$)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={editLimit}
                        onChange={(e) => setEditLimit(e.target.value)}
                        placeholder="0,00"
                        className="w-full h-11 px-3.5 rounded-xl bg-muted/60 border border-border text-white text-sm focus:outline-none focus:border-[#b300e4] focus:ring-1 focus:ring-[#b300e4] transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-foreground">
                          Dia Fechamento (Corte) <span className="text-red-400">*</span>
                        </label>
                        <span className="text-[10px] text-muted-foreground/80">Ex: 10</span>
                      </div>
                      <input
                        type="number"
                        min="1"
                        max="31"
                        required
                        value={editClosingDay}
                        onChange={(e) => setEditClosingDay(e.target.value)}
                        placeholder="Ex: 10"
                        className="w-full h-11 px-3.5 rounded-xl bg-muted/60 border border-border text-white text-sm focus:outline-none focus:border-[#b300e4] focus:ring-1 focus:ring-[#b300e4] transition-all"
                      />
                      <p className="text-[11px] text-muted-foreground">
                        Até este dia as compras entram na fatura atual.
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-foreground">
                          Dia Vencimento (Pagamento) <span className="text-red-400">*</span>
                        </label>
                        <span className="text-[10px] text-muted-foreground/80">Ex: 20</span>
                      </div>
                      <input
                        type="number"
                        min="1"
                        max="31"
                        required
                        value={editDueDay}
                        onChange={(e) => setEditDueDay(e.target.value)}
                        placeholder="Ex: 20"
                        className="w-full h-11 px-3.5 rounded-xl bg-muted/60 border border-border text-white text-sm focus:outline-none focus:border-[#b300e4] focus:ring-1 focus:ring-[#b300e4] transition-all"
                      />
                      <p className="text-[11px] text-muted-foreground">
                        Dia limite para pagar o valor da fatura.
                      </p>
                    </div>
                  </div>

                  {/* Resumo do ciclo de faturas */}
                  {editClosingDay && editDueDay && (
                    <div className="p-3 rounded-xl bg-muted/50 border border-border flex items-center gap-2.5 text-xs text-foreground">
                      <Info className="w-4 h-4 text-[#b300e4] shrink-0" />
                      <span>
                        Resumo: Compras até dia <strong>{editClosingDay}</strong> entram na fatura com vencimento dia <strong>{editDueDay}</strong>.
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Toggle Switch Somar no saldo geral */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-muted/60/70 border border-border/80">
                <div className="flex flex-col pr-3">
                  <span className="text-sm font-semibold text-white">Somar no saldo geral</span>
                  <span className="text-xs text-muted-foreground">
                    {editingAccount.type === "CONTA"
                      ? "Contabiliza o saldo desta conta no valor total do dashboard"
                      : "Contabiliza as faturas deste cartão nas despesas do dashboard"}
                  </span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={editIncludeInTotal}
                  onClick={() => setEditIncludeInTotal(!editIncludeInTotal)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    editIncludeInTotal ? "bg-[#b300e4]" : "bg-zinc-700"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      editIncludeInTotal ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Botões do modal */}
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingAccount(null)}
                  className="px-4 py-2 rounded-xl text-xs md:text-sm font-semibold text-muted-foreground hover:text-white hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs md:text-sm font-bold bg-[#b300e4] hover:bg-[#b300e4]/90 text-white shadow-md shadow-[#b300e4]/25 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <span>Salvar Alterações</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
