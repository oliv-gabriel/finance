"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { CreditCard, Wallet, Plus, MoreVertical, Calendar, Loader2, EyeOff, ChevronLeft, ChevronRight, X, ChevronDown, CheckCircle2 } from "lucide-react";
import { payCardBill } from "@/app/actions/transactions";
import { toggleAccountIncludeInTotal } from "@/app/actions/accounts";
import CardInvoiceModal from "@/components/accounts/CardInvoiceModal";
import { useRouter } from "next/navigation";

interface CardData {
  id: string;
  name: string;
  faturaAtual: number;
  limiteDisponivel: number;
  closingDay: number | null;
  status: string;
  isPaid?: boolean;
  includeInTotal?: boolean;
}

interface AccountData {
  id: string;
  name: string;
  balance: number;
  includeInTotal?: boolean;
}

interface FinancialSummaryProps {
  creditCards: CardData[];
  accounts: AccountData[];
  month: number;
  year: number;
}

const getBankIcon = (name: string) => {
  const nameLower = name.toLowerCase();
  if (nameLower.includes("brasil")) return "https://raw.githubusercontent.com/budgi-it/brazilian-financial-icons/835b29d98d5f30a57dfb6d8b20652f215e2e010a/banco-do-brasil.svg";
  if (nameLower.includes("99")) return "https://raw.githubusercontent.com/budgi-it/brazilian-financial-icons/835b29d98d5f30a57dfb6d8b20652f215e2e010a/99-pay.svg";
  if (nameLower.includes("carteira")) return "https://cdn.despezzas.com.br/svgs/carteira.svg";
  if (nameLower.includes("nubank")) return "https://raw.githubusercontent.com/budgi-it/brazilian-financial-icons/835b29d98d5f30a57dfb6d8b20652f215e2e010a/nubank.svg";
  if (nameLower.includes("itau")) return "https://raw.githubusercontent.com/budgi-it/brazilian-financial-icons/835b29d98d5f30a57dfb6d8b20652f215e2e010a/itau.svg";
  if (nameLower.includes("bradesco")) return "https://raw.githubusercontent.com/budgi-it/brazilian-financial-icons/835b29d98d5f30a57dfb6d8b20652f215e2e010a/bradesco.svg";
  if (nameLower.includes("inter")) return "https://raw.githubusercontent.com/budgi-it/brazilian-financial-icons/835b29d98d5f30a57dfb6d8b20652f215e2e010a/banco-inter.svg";
  if (nameLower.includes("santander")) return "https://raw.githubusercontent.com/budgi-it/brazilian-financial-icons/835b29d98d5f30a57dfb6d8b20652f215e2e010a/santander.svg";
  return "https://cdn.despezzas.com.br/svgs/carteira.svg"; // fallback
};

export default function FinancialSummary({ creditCards, accounts, month, year }: FinancialSummaryProps) {
  const router = useRouter();
  const [payingId, setPayingId] = useState<string | null>(null);
  const [togglingAccountId, setTogglingAccountId] = useState<string | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [paymentCard, setPaymentCard] = useState<CardData | null>(null);
  const [selectedPaymentAccount, setSelectedPaymentAccount] = useState<string>("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (paymentCard) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [paymentCard]);

  const accountsRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  const scrollContainer = (ref: React.RefObject<HTMLDivElement | null>, direction: "left" | "right") => {
    if (ref.current) {
      const scrollAmount = ref.current.clientWidth;
      ref.current.scrollBy({ left: direction === "left" ? -scrollAmount : scrollAmount, behavior: "smooth" });
    }
  };

  const sortedAccounts = [...accounts].sort((a, b) => b.balance - a.balance);
  const accountChunks: AccountData[][] = [];
  for (let i = 0; i < sortedAccounts.length; i += 3) {
    accountChunks.push(sortedAccounts.slice(i, i + 3));
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const handleOpenPaymentModal = (card: CardData) => {
    setPaymentCard(card);
    const defaultAcc = accounts.find(a => a.includeInTotal !== false) || accounts[0];
    setSelectedPaymentAccount(defaultAcc?.id || "");
  };

  const handleConfirmPayment = async () => {
    if (!paymentCard) return;
    if (!selectedPaymentAccount) {
      alert("Por favor, selecione a conta de onde o valor sairá.");
      return;
    }

    setPayingId(paymentCard.id);
    try {
      const result = await payCardBill(paymentCard.id, month, year, selectedPaymentAccount);
      if (!result.success) {
        alert(result.error || "Erro ao pagar fatura");
      } else {
        setPaymentCard(null);
        router.refresh();
      }
    } catch (error) {
      console.error(error);
      alert("Erro ao processar pagamento");
    } finally {
      setPayingId(null);
    }
  };

  const toggleAccountVisibility = async (account: AccountData) => {
    if (togglingAccountId) return;

    setTogglingAccountId(account.id);
    try {
      const result = await toggleAccountIncludeInTotal(account.id, account.includeInTotal === false);
      if (!result.success) alert(result.error || "Não foi possível alterar a visibilidade da conta.");
      else router.refresh();
    } catch {
      alert("Não foi possível alterar a visibilidade da conta.");
    } finally {
      setTogglingAccountId(null);
    }
  };

  const getMonthName = (m: number) => {
    const date = new Date(year, m - 1);
    return date.toLocaleString('pt-BR', { month: 'long' });
  };

  return (
    <div className="grid w-full min-w-0 grid-cols-1 gap-5 md:gap-6 xl:grid-cols-2">
      {/* Minhas contas (Primeiro no layout mobile como na referência) */}
      <div className="bg-card border border-border/70 shadow-xs flex h-auto min-w-0 w-full flex-col overflow-hidden rounded-2xl p-5 md:p-6">
        <div className="flex w-full min-w-0 flex-col">
          <div className="mb-4 flex min-w-0 items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="size-8 rounded-xl bg-[#b300e4]/15 text-[#b300e4] flex items-center justify-center shadow-2xs">
                <Wallet className="h-4 w-4" />
              </div>
              <h2 className="text-foreground text-base md:text-lg font-semibold tracking-tight">
                Minhas <span className="font-extrabold">contas</span>
              </h2>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {accountChunks.length > 1 && (
                <div className="flex bg-muted/50 rounded-lg p-0.5 mr-2">
                  <button onClick={() => scrollContainer(accountsRef, "left")} className="p-1.5 rounded-md hover:bg-background hover:shadow-xs transition-all cursor-pointer">
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button onClick={() => scrollContainer(accountsRef, "right")} className="p-1.5 rounded-md hover:bg-background hover:shadow-xs transition-all cursor-pointer">
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
              <button title="Adicionar conta" className="text-[#b300e4] hover:bg-[#b300e4]/15 p-1.5 rounded-xl transition-all cursor-pointer">
                <Plus className="h-6 w-6 stroke-[2.5]" />
              </button>
            </div>
          </div>
          
          <div 
            ref={accountsRef} 
            className="no-scrollbar flex w-full min-w-0 max-w-full overflow-x-auto scroll-smooth snap-x snap-mandatory gap-4 pb-2"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {accountChunks.length > 0 ? (
              accountChunks.map((chunk, chunkIndex) => (
                <ul key={chunkIndex} className="flex w-full min-w-0 flex-none snap-center flex-col gap-2 divide-y divide-border/30">
                  {chunk.map((acc) => (
                    <li key={acc.id}>
                      <button
                        type="button"
                        disabled={Boolean(togglingAccountId)}
                        onClick={() => toggleAccountVisibility(acc)}
                        title={acc.includeInTotal === false ? "Clique para incluir esta conta no saldo atual" : "Clique para ocultar esta conta do saldo atual"}
                        className="flex w-full cursor-pointer items-center justify-between rounded-xl px-2 py-3.5 text-left transition-colors hover:bg-muted/40 disabled:cursor-wait disabled:opacity-70"
                      >
                        <div className="flex items-center gap-3.5">
                          <img
                            alt={acc.name}
                            width={42}
                            height={42}
                            className="rounded-full border border-border/40 object-contain p-1 bg-background/50"
                            src={getBankIcon(acc.name)}
                          />
                          <div className="flex flex-col">
                            <p className="text-foreground text-sm md:text-base font-semibold leading-snug">{acc.name}</p>
                            <div className="flex items-center gap-1.5 mt-0.5 text-xs text-muted-foreground">
                              <span>Pessoal</span>
                              {togglingAccountId === acc.id && acc.includeInTotal !== false && (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              )}
                              {acc.includeInTotal === false && (
                                <span title="Conta oculta do saldo atual" className="inline-flex items-center gap-1 font-medium text-muted-foreground ml-1">
                                  • {togglingAccountId === acc.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <EyeOff className="h-3 w-3 inline" />} Oculta
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[11px] font-medium text-muted-foreground uppercase block leading-none mb-1">Saldo de</span>
                          <p className={`font-bold tabular-nums text-base md:text-lg ${acc.balance >= 0 ? "text-foreground" : "text-red-500"}`}>
                            {formatCurrency(acc.balance)}
                          </p>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              ))
            ) : (
              <div className="min-w-full flex justify-center">
                <p className="text-center text-sm text-muted-foreground py-6">Nenhuma conta cadastrada.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Meus cartões */}
      <div className="bg-card border border-border/70 shadow-xs flex h-auto min-w-0 w-full flex-col overflow-hidden rounded-2xl p-5 md:p-6">
        <div className="flex w-full min-w-0 flex-col">
          <div className="mb-4 flex min-w-0 items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="size-8 rounded-xl bg-[#b300e4]/15 text-[#b300e4] flex items-center justify-center shadow-2xs">
                <CreditCard className="h-4 w-4" />
              </div>
              <h2 className="text-foreground text-base md:text-lg font-semibold tracking-tight">
                Meus <span className="font-extrabold">cartões</span>
              </h2>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {creditCards.length > 1 && (
                <div className="flex bg-muted/50 rounded-lg p-0.5 mr-2">
                  <button onClick={() => scrollContainer(cardsRef, "left")} className="p-1.5 rounded-md hover:bg-background hover:shadow-xs transition-all cursor-pointer">
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button onClick={() => scrollContainer(cardsRef, "right")} className="p-1.5 rounded-md hover:bg-background hover:shadow-xs transition-all cursor-pointer">
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
              <button title="Adicionar cartão" className="text-[#b300e4] hover:bg-[#b300e4]/15 p-1.5 rounded-xl transition-all cursor-pointer">
                <Plus className="h-6 w-6 stroke-[2.5]" />
              </button>
            </div>
          </div>
          
          <div 
            ref={cardsRef} 
            className="no-scrollbar flex w-full min-w-0 max-w-full overflow-x-auto scroll-smooth snap-x snap-mandatory gap-4 pb-2"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {creditCards.length > 0 ? (
              creditCards.map((card) => (
                <div 
                  key={card.id} 
                  onClick={() => setSelectedCardId(card.id)}
                  className="group relative flex w-full min-w-0 flex-none snap-center cursor-pointer flex-col rounded-xl border border-transparent bg-muted/30 p-4 shadow-2xs transition-all duration-200 hover:border-[#b300e4]/40 hover:bg-muted/60 hover:shadow-md xl:hover:scale-[1.01]"
                >
                  <div className="absolute top-3 right-3 z-10">
                    <button 
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex shrink-0 cursor-pointer items-center justify-center rounded-full text-[#b300e4] hover:bg-accent hover:text-accent-foreground size-9"
                    >
                      <MoreVertical className="h-5 w-5" />
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-3 pr-9">
                    <img
                      alt={card.name}
                      width={40}
                      height={40}
                      className="shrink-0 rounded-md"
                      src={getBankIcon(card.name)}
                    />
                    <div className="flex min-w-0 flex-1 items-center gap-1.5 flex-wrap">
                      <p className="text-foreground min-w-0 truncate text-sm font-medium">{card.name}</p>
                      {card.includeInTotal === false && (
                        <span title="Oculto do saldo atual" className="inline-flex items-center gap-1 text-[11px] font-medium bg-muted text-muted-foreground px-2 py-0.5 rounded-md border border-border/60">
                          <EyeOff className="h-3.5 w-3.5" /> Oculta
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="bg-card mt-4 flex min-w-0 items-center justify-between rounded-lg px-4 py-3 border border-border">
                    <span className="text-muted-foreground text-xs font-normal truncate">Fatura de {getMonthName(month)}</span>
                    <span className="text-foreground ml-2 shrink-0 text-sm font-medium tabular-nums">{formatCurrency(card.faturaAtual)}</span>
                  </div>
                  
                  <div className="text-foreground mt-5 flex items-center gap-2 px-1">
                    <CreditCard className="opacity-70 h-4 w-4" />
                    <p className="text-xs font-normal">
                      Limite disponível <strong className="font-bold">{formatCurrency(card.limiteDisponivel)}</strong>
                    </p>
                  </div>
                  
                  <div className="text-foreground mt-2.5 flex flex-col items-start justify-between gap-2 px-1 sm:flex-row sm:items-center">
                    <div className="flex min-w-0 items-center gap-2">
                      <Calendar className="opacity-70 h-4 w-4" />
                      <p className="text-xs font-normal">Fecha em {card.closingDay?.toString().padStart(2, '0')} de {getMonthName(month).slice(0, 3)}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <span className={`size-2.5 rounded-full ${
                        card.isPaid || card.status === "Paga"
                          ? "bg-emerald-400"
                          : card.status === "Aberto"
                          ? "bg-green-500"
                          : "bg-red-500"
                      }`}></span>
                      <span className={`text-xs font-normal ${
                        card.isPaid || card.status === "Paga"
                          ? "text-emerald-400 font-semibold"
                          : card.status === "Aberto"
                          ? "text-green-500"
                          : "text-red-500"
                      }`}>
                        {card.isPaid || card.status === "Paga" ? "Fatura paga" : card.status === "Aberto" ? "Em aberto" : "Fechado"}
                      </span>
                    </div>
                  </div>
                  
                  <button 
                    type="button" 
                    disabled={payingId === card.id || card.faturaAtual === 0 || card.isPaid || card.status === "Paga"}
                    onClick={(e) => { e.stopPropagation(); handleOpenPaymentModal(card); }}
                    className={`mt-5 h-10 w-full rounded-full border text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                      card.isPaid || card.status === "Paga"
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 cursor-default"
                        : "border-border bg-card text-foreground hover:bg-[#b300e4] hover:text-white hover:border-[#b300e4] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    }`}
                  >
                    {payingId === card.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : card.isPaid || card.status === "Paga" ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    ) : null}
                    {card.isPaid || card.status === "Paga" ? "Fatura paga" : "Pagar fatura"}
                  </button>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                {/* Ilustração CSS de Cartões Sobrepostos estilo referência */}
                <div className="relative w-28 h-20 mb-4">
                  <div className="absolute top-0 left-2 w-22 h-14 bg-gradient-to-tr from-emerald-600 to-emerald-400 rounded-xl transform -rotate-6 shadow-md opacity-80 border border-white/20" />
                  <div className="absolute top-2 right-1 w-22 h-14 bg-gradient-to-tr from-zinc-800 to-zinc-700 rounded-xl transform rotate-3 shadow-lg flex flex-col justify-between p-2 border border-white/10">
                    <div className="w-5 h-3.5 bg-amber-400/80 rounded-sm" />
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-white/40" />
                      <div className="w-2 h-2 rounded-full bg-white/40 -ml-1" />
                    </div>
                  </div>
                  <div className="absolute -bottom-2 right-2 size-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg ring-4 ring-card">
                    <Plus className="h-5 w-5 stroke-[3]" />
                  </div>
                </div>
                <p className="text-sm font-semibold text-foreground mt-2">Nenhum cartão cadastrado</p>
                <p className="text-xs text-muted-foreground mt-0.5">Cadastre um cartão para gerenciar suas faturas e limites aqui.</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <CardInvoiceModal
        isOpen={!!selectedCardId}
        onClose={() => setSelectedCardId(null)}
        cardId={selectedCardId}
        initialMonth={month}
        initialYear={year}
      />

      {/* Modal de Pagamento de Fatura com Seleção de Conta */}
      {mounted && paymentCard && createPortal(
        <div 
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto animate-in fade-in-0"
          onClick={() => !payingId && setPaymentCard(null)}
        >
          <div 
            className="w-full max-w-md rounded-2xl bg-[#141414] border border-white/10 p-6 shadow-2xl space-y-5 animate-in zoom-in-95 text-foreground my-auto shrink-0 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-[#b300e4]/15 text-[#d246f8]">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Pagar Fatura</h3>
                  <p className="text-xs text-zinc-400">Cartão {paymentCard.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => !payingId && setPaymentCard(null)}
                className="text-zinc-500 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-zinc-900 border border-white/5 flex items-center justify-between">
              <div>
                <p className="text-xs text-zinc-400">Valor da Fatura ({getMonthName(month)})</p>
                <p className="text-xl font-extrabold text-white mt-0.5">
                  {formatCurrency(paymentCard.faturaAtual)}
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#b300e4]/20 text-[#d246f8] border border-[#b300e4]/30">
                {paymentCard.status}
              </span>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-medium text-zinc-300">
                Conta de onde o valor será descontado
              </label>
              <div className="relative">
                <select
                  value={selectedPaymentAccount}
                  onChange={(e) => setSelectedPaymentAccount(e.target.value)}
                  className="w-full h-11 bg-zinc-900 border border-white/10 rounded-xl px-3 pr-8 text-sm text-white focus:outline-none focus:border-[#b300e4] cursor-pointer appearance-none"
                >
                  <option value="" disabled>Selecione uma conta bancária</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} — Saldo: {formatCurrency(acc.balance)}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                Ao confirmar, o valor de <strong>{formatCurrency(paymentCard.faturaAtual)}</strong> será debitado do saldo da conta selecionada e a fatura será marcada como paga.
              </p>
              {selectedPaymentAccount && (() => {
                const chosen = accounts.find(a => a.id === selectedPaymentAccount);
                if (!chosen) return null;
                const remaining = chosen.balance - paymentCard.faturaAtual;
                return (
                  <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-zinc-950 border border-white/5 text-zinc-400">
                    <span>Saldo restante na conta:</span>
                    <span className={`font-bold tabular-nums ${remaining >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {formatCurrency(remaining)}
                    </span>
                  </div>
                );
              })()}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                disabled={!!payingId}
                onClick={() => setPaymentCard(null)}
                className="flex-1 h-10 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold border border-white/10 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!!payingId || !selectedPaymentAccount || paymentCard.faturaAtual === 0}
                onClick={handleConfirmPayment}
                className="flex-1 h-10 rounded-xl bg-[#b300e4] hover:bg-[#9a00c4] text-white text-xs font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#b300e4]/20 disabled:opacity-40"
              >
                {payingId ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Processando...
                  </>
                ) : (
                  "Confirmar Pagamento"
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
