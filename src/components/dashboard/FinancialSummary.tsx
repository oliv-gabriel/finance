"use client";

import React, { useState } from "react";
import { CreditCard, Wallet, Plus, MoreVertical, Calendar, Loader2, EyeOff } from "lucide-react";
import { payCardBill } from "@/app/actions/transactions";
import CardInvoiceModal from "@/components/accounts/CardInvoiceModal";

interface CardData {
  id: string;
  name: string;
  faturaAtual: number;
  limiteDisponivel: number;
  closingDay: number | null;
  status: string;
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
  const [payingId, setPayingId] = useState<string | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const handlePayBill = async (cardId: string) => {
    if (!confirm("Deseja marcar todas as transações deste mês como pagas?")) return;
    
    setPayingId(cardId);
    try {
      const result = await payCardBill(cardId, month, year);
      if (!result.success) {
        alert("Erro ao pagar fatura");
      }
    } catch (error) {
      console.error(error);
      alert("Erro ao processar pagamento");
    } finally {
      setPayingId(null);
    }
  };

  const getMonthName = (m: number) => {
    const date = new Date(year, m - 1);
    return date.toLocaleString('pt-BR', { month: 'long' });
  };

  return (
    <div className="flex w-full flex-col gap-5 md:gap-6 md:flex-row md:justify-between">
      {/* Minhas contas (Primeiro no layout mobile como na referência) */}
      <div className="bg-card border border-border/70 shadow-xs flex h-auto w-full flex-col rounded-2xl p-5 md:p-6">
        <div className="flex w-full flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-xl bg-[#b300e4]/15 text-[#b300e4] flex items-center justify-center shadow-2xs">
                <Wallet className="h-4 w-4" />
              </div>
              <h2 className="text-foreground text-base md:text-lg font-semibold tracking-tight">
                Minhas <span className="font-extrabold">contas</span>
              </h2>
            </div>
            <button title="Adicionar conta" className="text-[#b300e4] hover:bg-[#b300e4]/15 p-1.5 rounded-xl transition-all cursor-pointer">
              <Plus className="h-6 w-6 stroke-[2.5]" />
            </button>
          </div>
          
          <ul className="flex w-full flex-col gap-2 divide-y divide-border/30">
            {accounts.length > 0 ? (
              accounts.map((acc) => (
                <li key={acc.id} className="hover:bg-muted/40 flex w-full cursor-pointer items-center justify-between rounded-xl px-2 py-3.5 transition-colors">
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
                        {acc.includeInTotal === false && (
                          <span title="Conta oculta do saldo atual" className="inline-flex items-center gap-1 font-medium text-muted-foreground ml-1">
                            • <EyeOff className="h-3 w-3 inline" /> Oculta
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
                </li>
              ))
            ) : (
              <p className="text-center text-sm text-muted-foreground py-6">Nenhuma conta cadastrada.</p>
            )}
          </ul>
        </div>
      </div>

      {/* Meus cartões */}
      <div className="bg-card border border-border/70 shadow-xs flex h-auto w-full flex-col rounded-2xl p-5 md:p-6">
        <div className="flex w-full flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-xl bg-[#b300e4]/15 text-[#b300e4] flex items-center justify-center shadow-2xs">
                <CreditCard className="h-4 w-4" />
              </div>
              <h2 className="text-foreground text-base md:text-lg font-semibold tracking-tight">
                Meus <span className="font-extrabold">cartões</span>
              </h2>
            </div>
            <button title="Adicionar cartão" className="text-[#b300e4] hover:bg-[#b300e4]/15 p-1.5 rounded-xl transition-all cursor-pointer">
              <Plus className="h-6 w-6 stroke-[2.5]" />
            </button>
          </div>
          
          <div className="flex w-full flex-col gap-3">
            {creditCards.length > 0 ? (
              creditCards.map((card) => (
                <div 
                  key={card.id} 
                  onClick={() => setSelectedCardId(card.id)}
                  className="group relative flex w-full cursor-pointer flex-col rounded-xl p-4 transition-all duration-200 bg-muted/30 hover:bg-muted/60 hover:border-[#b300e4]/40 border border-transparent shadow-2xs hover:shadow-md hover:scale-[1.01]"
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
                  
                  <div className="bg-card mt-4 flex items-center justify-between rounded-lg px-4 py-3 border border-border">
                    <span className="text-muted-foreground text-xs font-normal truncate">Fatura de {getMonthName(month)}</span>
                    <span className="text-foreground text-sm font-medium ml-2">{formatCurrency(card.faturaAtual)}</span>
                  </div>
                  
                  <div className="text-foreground mt-5 flex items-center gap-2 px-1">
                    <CreditCard className="opacity-70 h-4 w-4" />
                    <p className="text-xs font-normal">
                      Limite disponível <strong className="font-bold">{formatCurrency(card.limiteDisponivel)}</strong>
                    </p>
                  </div>
                  
                  <div className="text-foreground mt-2.5 flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                      <Calendar className="opacity-70 h-4 w-4" />
                      <p className="text-xs font-normal">Fecha em {card.closingDay?.toString().padStart(2, '0')} de {getMonthName(month).slice(0, 3)}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={`size-2.5 rounded-full ${card.status === "Aberto" ? "bg-green-500" : "bg-red-500"}`}></span>
                      <span className={`text-xs font-normal ${card.status === "Aberto" ? "text-green-500" : "text-red-500"}`}>
                        {card.status === "Aberto" ? "Em aberto" : "Fechado"}
                      </span>
                    </div>
                  </div>
                  
                  <button 
                    type="button" 
                    disabled={payingId === card.id || card.faturaAtual === 0}
                    onClick={(e) => { e.stopPropagation(); handlePayBill(card.id); }}
                    className="border-border bg-card text-foreground hover:bg-muted mt-5 h-10 w-full rounded-full border text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {payingId === card.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : null}
                    Pagar fatura
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
    </div>
  );
}
