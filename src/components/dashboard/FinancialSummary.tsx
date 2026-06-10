"use client";

import React, { useState } from "react";
import { CreditCard, Wallet, Plus, MoreVertical, Calendar, Loader2 } from "lucide-react";
import { payCardBill } from "@/app/actions/transactions";

interface CardData {
  id: string;
  name: string;
  faturaAtual: number;
  limiteDisponivel: number;
  closingDay: number | null;
  status: string;
}

interface AccountData {
  id: string;
  name: string;
  balance: number;
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
    <div className="3xl:gap-6 flex w-full flex-col gap-4 md:flex-row md:justify-between">
      {/* Meus cartões */}
      <div className="bg-card border-border flex h-auto w-full flex-col rounded-2xl border px-4 py-4 sm:px-6 sm:py-6">
        <div className="flex w-full flex-col">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="text-foreground h-5 w-5" />
              <h1 className="text-foreground text-sm font-normal">
                Meus <strong className="font-bold">cartões</strong>
              </h1>
            </div>
            <Plus className="text-blue-500 cursor-pointer h-5 w-5" />
          </div>
          
          <div className="bg-border/60 my-4 h-px w-full"></div>
          
          <div className="flex w-full flex-col gap-3">
            {creditCards.length > 0 ? (
              creditCards.map((card) => (
                <div key={card.id} className="group relative flex w-full cursor-default flex-col rounded-xl p-4 transition-colors bg-muted/30 hover:bg-muted/50">
                  <div className="absolute top-3 right-3 z-10">
                    <button className="inline-flex shrink-0 cursor-pointer items-center justify-center rounded-full text-primary hover:bg-accent hover:text-accent-foreground size-9">
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
                    <div className="flex min-w-0 flex-1 items-center gap-1.5">
                      <p className="text-foreground min-w-0 truncate text-sm font-medium">{card.name}</p>
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
                    onClick={() => handlePayBill(card.id)}
                    className="border-border bg-card text-foreground hover:bg-muted mt-5 h-10 w-full rounded-full border text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {payingId === card.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : null}
                    Pagar fatura
                  </button>
                </div>
              ))
            ) : (
              <p className="text-center text-sm text-muted-foreground py-4">Nenhum cartão cadastrado.</p>
            )}
          </div>
        </div>
      </div>

      {/* Minhas contas */}
      <div className="bg-card border-border flex h-auto w-full flex-col rounded-2xl border px-4 py-4 sm:px-6 sm:py-6">
        <div className="flex w-full flex-col">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="text-foreground h-5 w-5" />
              <h1 className="text-foreground text-sm font-normal">
                Minhas <strong className="font-bold">contas</strong>
              </h1>
            </div>
            <Plus className="text-blue-500 cursor-pointer h-5 w-5" />
          </div>
          
          <div className="bg-border/60 my-4 h-px w-full"></div>
          
          <ul className="flex w-full flex-col gap-1">
            {accounts.length > 0 ? (
              accounts.map((acc) => (
                <li key={acc.id} className="hover:bg-muted flex w-full cursor-pointer items-center justify-between rounded-md px-2 py-3 transition-colors">
                  <div className="flex items-center gap-3">
                    <img
                      alt={acc.name}
                      width={32}
                      height={32}
                      className="rounded-full"
                      src={getBankIcon(acc.name)}
                    />
                    <div>
                      <p className="text-foreground text-sm font-medium">{acc.name}</p>
                    </div>
                  </div>
                  <p className={`font-semibold tabular-nums text-sm ${acc.balance >= 0 ? "text-foreground" : "text-red-500"}`}>
                    {formatCurrency(acc.balance)}
                  </p>
                </li>
              ))
            ) : (
              <p className="text-center text-sm text-muted-foreground py-4">Nenhuma conta cadastrada.</p>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
