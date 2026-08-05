"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  MoreVertical, 
  CheckCircle, 
  Edit2, 
  Trash2, 
  ArrowUpRight, 
  ArrowDownLeft,
  Calendar,
  Tag
} from "lucide-react";
import Link from "next/link";
import { toggleTransactionPaid, deleteTransaction } from "@/app/actions/transactions";

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
    icon: string;
  };
  account?: {
    name: string;
  };
}

interface TransactionTableProps {
  transactions: Transaction[];
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
  return "https://cdn.despezzas.com.br/svgs/carteira.svg";
};

export default function TransactionTable({ transactions }: TransactionTableProps) {
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

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja realmente excluir esta transação?")) return;
    try {
      await deleteTransaction(id);
    } catch (error) {
      console.error(error);
      alert("Falha ao excluir transação");
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <div className="overflow-hidden border border-border/70 bg-card rounded-2xl shadow-xs">
      <div className="relative w-full overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/40 text-muted-foreground">
            <tr className="border-b border-border/60">
              <th className="px-4 py-3 font-medium w-24">Data</th>
              <th className="px-4 py-3 font-medium">Descrição</th>
              <th className="px-4 py-3 font-medium hidden md:table-cell">Categoria</th>
              <th className="px-4 py-3 font-medium">Conta</th>
              <th className="px-4 py-3 font-medium w-24">Status</th>
              <th className="px-4 py-3 font-medium text-right w-32">Valor</th>
              <th className="px-4 py-3 w-12"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {transactions.map((t) => (
              <tr key={t.id} className="group hover:bg-muted/30 transition-colors cursor-default">
                <td className="px-4 py-4 align-middle whitespace-nowrap">
                  <div className="flex flex-col leading-tight">
                    <span className="text-foreground font-medium">
                      {format(new Date(t.date), "dd MMM", { locale: ptBR })}
                    </span>
                    <span className="text-muted-foreground text-[10px]">
                      {format(new Date(t.date), "yyyy")}
                    </span>
                  </div>
                </td>
                
                <td className="px-4 py-4 align-middle">
                  <div className="flex items-center gap-3">
                    <div 
                      className="flex items-center justify-center rounded-full shrink-0 h-8 w-8 text-white"
                      style={{ backgroundColor: t.category.color }}
                    >
                      <Tag size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-foreground font-medium truncate">{t.description}</p>
                      <p className="text-muted-foreground text-[10px] md:hidden">
                        {t.category.name}
                      </p>
                    </div>
                  </div>
                </td>

                <td className="px-4 py-4 align-middle hidden md:table-cell">
                  <div className="flex flex-col leading-tight">
                    <span className="text-foreground truncate">{t.category.name}</span>
                  </div>
                </td>

                <td className="px-4 py-4 align-middle">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full border border-border overflow-hidden flex items-center justify-center bg-white p-0.5">
                      <img 
                        src={getBankIcon(t.account?.name || "")} 
                        alt={t.account?.name}
                        className="h-full w-full object-contain"
                      />
                    </div>
                    <span className="text-foreground font-medium truncate max-w-[100px]">
                      {t.account?.name || "N/A"}
                    </span>
                  </div>
                </td>

                <td className="px-4 py-4 align-middle">
                  <button
                    onClick={() => handleTogglePaid(t.id, t.paid)}
                    disabled={loadingId === t.id}
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border transition-all hover:scale-105 active:scale-95 disabled:opacity-50 ${
                      t.paid 
                        ? "bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20" 
                        : "bg-yellow-500/10 text-yellow-500 border-yellow-500/20 hover:bg-yellow-500/20"
                    }`}
                  >
                    {loadingId === t.id ? (
                      <span className="h-2 w-2 rounded-full border-2 border-current border-t-transparent animate-spin mr-1"></span>
                    ) : null}
                    {t.paid ? "Pago" : "Não pago"}
                  </button>
                </td>

                <td className="px-4 py-4 align-middle text-right relative group">
                  <div className="flex items-center justify-end">
                    <span className={`font-semibold whitespace-nowrap ${
                      t.type === "INCOME" ? "text-green-500" : "text-red-500"
                    }`}>
                      {t.type === "INCOME" ? "+" : "-"} {formatCurrency(t.amount)}
                    </span>
                  </div>
                </td>

                <td className="px-4 py-4 align-middle text-right">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link href={`/transactions/edit/${t.id}`}>
                      <button className="p-1.5 hover:bg-muted rounded-full text-muted-foreground hover:text-foreground">
                        <Edit2 size={14} />
                      </button>
                    </Link>
                    <button 
                      onClick={() => handleDelete(t.id)}
                      className="p-1.5 hover:bg-red-500/10 rounded-full text-muted-foreground hover:text-red-500"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {transactions.length === 0 && (
        <div className="p-12 text-center text-muted-foreground bg-card">
          <Calendar className="mx-auto h-12 w-12 mb-4 opacity-10" />
          <p>Nenhuma transação encontrada neste período.</p>
        </div>
      )}
    </div>
  );
}
