"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import { History, CheckCircle, Tag } from "lucide-react";
import Link from "next/link";
import { toggleTransactionPaid } from "@/app/actions/transactions";

interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: Date | string;
  type: string;
  paid: boolean;
  category: {
    name: string;
    color: string;
  } | null;
}

interface RecentTransactionsProps {
  transactions: Transaction[];
}

export default function RecentTransactions({ transactions }: RecentTransactionsProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleTogglePaid = async (id: string, currentStatus: boolean) => {
    setLoadingId(id);
    try {
      await toggleTransactionPaid(id, !currentStatus);
    } catch (error) {
      console.error(error);
      alert("Falha ao atualizar status");
    } finally {
      setLoadingId(null);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <div className="space-y-4">
      {transactions.map((t) => (
        <div key={t.id} className="group flex items-center justify-between border-b border-border/40 pb-3 last:border-0 last:pb-0">
          <div className="flex items-center min-w-0">
            <div 
              className="mr-3 h-2.5 w-2.5 rounded-full flex-shrink-0" 
              style={{ backgroundColor: t.category?.color || '#b300e4' }}
            />
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate text-foreground">{t.description}</p>
              <div className="flex items-center gap-2">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                  {t.category?.name || (t.type === "TRANSFER" ? "Transferência" : "Geral")}
                </p>
                <button
                  onClick={() => handleTogglePaid(t.id, t.paid)}
                  disabled={loadingId === t.id}
                  className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider transition-all hover:scale-105 active:scale-95 disabled:opacity-50 ${
                    t.paid ? "bg-green-500/10 text-green-500 hover:bg-green-500/20" : "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20"
                  }`}
                >
                  {t.paid ? "Pago" : "Pendente"}
                </button>
              </div>
            </div>
          </div>
          <div className="text-right flex-shrink-0 ml-4 flex items-center gap-3">
            <div>
              <p className={`text-sm font-bold ${t.type === "INCOME" ? "text-green-500" : "text-red-500"}`}>
                {t.type === "INCOME" ? "+" : "-"} {formatCurrency(t.amount)}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {format(new Date(t.date), "dd/MM")}
              </p>
            </div>
          </div>
        </div>
      ))}
      {transactions.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-10">Nenhuma transação recente.</p>
      )}
    </div>
  );
}
