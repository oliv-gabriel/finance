"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  MoreVertical, CheckCircle2, Clock, Edit2, Trash2, Calendar, Tag, 
  ChevronUp, Search, Utensils, Wine, ShoppingBag, Car, Home, Smartphone, 
  Gamepad2, Plane, HeartPulse, GraduationCap, DollarSign, CreditCard as CreditCardIcon, 
  ArrowUpRight, ArrowDownLeft, TrendingUp, X, CheckCircle, ArrowRightLeft
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toggleTransactionPaid, deleteTransaction } from "@/app/actions/transactions";

interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: Date | string;
  type: string;
  paid: boolean;
  category?: {
    name: string;
    color: string;
    icon: string;
  } | null;
  account?: {
    name: string;
    type?: string;
  };
  destinationAccount?: {
    name: string;
    type?: string;
  };
}

interface TransactionTableProps {
  transactions: Transaction[];
  summary?: {
    income?: number;
    expenses?: number;
    balance?: number;
  };
}

const getBankIcon = (name: string) => {
  const nameLower = name.toLowerCase();
  if (nameLower.includes("brasil") || nameLower === "bb") return "https://raw.githubusercontent.com/budgi-it/brazilian-financial-icons/835b29d98d5f30a57dfb6d8b20652f215e2e010a/banco-do-brasil.svg";
  if (nameLower.includes("99")) return "https://raw.githubusercontent.com/budgi-it/brazilian-financial-icons/835b29d98d5f30a57dfb6d8b20652f215e2e010a/99-pay.svg";
  if (nameLower.includes("carteira")) return "https://cdn.despezzas.com.br/svgs/carteira.svg";
  if (nameLower.includes("nubank") || nameLower.includes("nu")) return "https://raw.githubusercontent.com/budgi-it/brazilian-financial-icons/835b29d98d5f30a57dfb6d8b20652f215e2e010a/nubank.svg";
  if (nameLower.includes("itau") || nameLower.includes("itaú")) return "https://raw.githubusercontent.com/budgi-it/brazilian-financial-icons/835b29d98d5f30a57dfb6d8b20652f215e2e010a/itau.svg";
  if (nameLower.includes("bradesco")) return "https://raw.githubusercontent.com/budgi-it/brazilian-financial-icons/835b29d98d5f30a57dfb6d8b20652f215e2e010a/bradesco.svg";
  if (nameLower.includes("inter")) return "https://raw.githubusercontent.com/budgi-it/brazilian-financial-icons/835b29d98d5f30a57dfb6d8b20652f215e2e010a/banco-inter.svg";
  if (nameLower.includes("santander")) return "https://raw.githubusercontent.com/budgi-it/brazilian-financial-icons/835b29d98d5f30a57dfb6d8b20652f215e2e010a/santander.svg";
  if (nameLower.includes("picpay")) return "https://cdn.despezzas.com.br/svgs/carteira.svg";
  return "https://cdn.despezzas.com.br/svgs/carteira.svg";
};

const getCategoryIconComponent = (name: string) => {
  const lower = name.toLowerCase();
  if (lower.includes("aliment") || lower.includes("restauran") || lower.includes("comida") || lower.includes("ifood") || lower.includes("lanche")) return Utensils;
  if (lower.includes("bar") || lower.includes("bebida") || lower.includes("vinho") || lower.includes("lazer")) return Wine;
  if (lower.includes("compra") || lower.includes("mercado") || lower.includes("loja") || lower.includes("supermercado")) return ShoppingBag;
  if (lower.includes("transpor") || lower.includes("uber") || lower.includes("carro") || lower.includes("gasolina") || lower.includes("combustível")) return Car;
  if (lower.includes("casa") || lower.includes("aluguel") || lower.includes("moradia") || lower.includes("luz") || lower.includes("água")) return Home;
  if (lower.includes("celular") || lower.includes("telefone") || lower.includes("internet") || lower.includes("assinatura") || lower.includes("spotify") || lower.includes("netflix")) return Smartphone;
  if (lower.includes("jogo") || lower.includes("game") || lower.includes("steam") || lower.includes("psn") || lower.includes("xbox")) return Gamepad2;
  if (lower.includes("viagem") || lower.includes("ferias") || lower.includes("voo") || lower.includes("hotel")) return Plane;
  if (lower.includes("saude") || lower.includes("saúde") || lower.includes("farmacia") || lower.includes("medico") || lower.includes("academia")) return HeartPulse;
  if (lower.includes("educa") || lower.includes("curso") || lower.includes("faculdade") || lower.includes("escola") || lower.includes("livro")) return GraduationCap;
  if (lower.includes("salario") || lower.includes("salário") || lower.includes("renda") || lower.includes("invest")) return DollarSign;
  return Tag;
};

export default function TransactionTable({ transactions, summary }: TransactionTableProps) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "income" | "expense" | "pending">("all");
  
  // Modais e Estados de Ação
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [deleteModalTx, setDeleteModalTx] = useState<Transaction | null>(null);
  const [editModalTx, setEditModalTx] = useState<Transaction | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const isSeries = (tx: Transaction) => {
    return Boolean((tx as any).seriesId || /\(\d+\/\d+\)/.test(tx.description));
  };

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

  const handleEditClick = (tx: Transaction) => {
    if (isSeries(tx)) {
      setEditModalTx(tx);
    } else {
      router.push(`/transactions/edit/${tx.id}`);
    }
  };

  const handleDeleteClick = (tx: Transaction) => {
    setDeleteModalTx(tx);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  };

  const formatNumberOnly = (value: number) => {
    return new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
  };

  // Filtragem no Desktop
  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (t.category?.name || "Transferência").toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (t.account?.name || "").toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;
    if (filterType === "income") return t.type === "INCOME";
    if (filterType === "expense") return t.type === "EXPENSE";
    if (filterType === "pending") return !t.paid;
    return true;
  });

  // Agrupamento por Data
  const groupTransactionsByDate = (list: Transaction[]) => {
    const groups: { [key: string]: Transaction[] } = {};
    list.forEach((t) => {
      const d = typeof t.date === "string" ? new Date(t.date) : t.date;
      const year = d.getUTCFullYear();
      const month = String(d.getUTCMonth() + 1).padStart(2, '0');
      const day = String(d.getUTCDate()).padStart(2, '0');
      const dateKey = `${year}-${month}-${day}`;
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(t);
    });

    const sortedKeys = Object.keys(groups).sort((a, b) => b.localeCompare(a));
    return sortedKeys.map((key) => ({
      dateKey: key,
      items: groups[key],
    }));
  };

  const formatGroupHeader = (dateStr: string) => {
    const parts = dateStr.split("-").map(Number);
    const d = new Date(parts[0], parts[1] - 1, parts[2]);

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 86400000);

    const dayMonth = format(d, "dd 'de' MMMM", { locale: ptBR });

    if (d.getTime() === today.getTime()) {
      return `Hoje, dia ${dayMonth}`;
    }
    if (d.getTime() === yesterday.getTime()) {
      return `Ontem, dia ${dayMonth}`;
    }
    const dow = format(d, "EEE.", { locale: ptBR });
    const dowCap = dow.charAt(0).toUpperCase() + dow.slice(1);
    return `${dowCap}, ${dayMonth}`;
  };

  const groupedMobile = groupTransactionsByDate(transactions);
  const groupedDesktop = groupTransactionsByDate(filteredTransactions);

  const calcIncome = summary?.income ?? transactions.filter(t => t.type === "INCOME").reduce((acc, curr) => acc + curr.amount, 0);
  const calcExpense = summary?.expenses ?? transactions.filter(t => t.type === "EXPENSE").reduce((acc, curr) => acc + curr.amount, 0);
  const calcBalance = calcIncome - calcExpense;

  return (
    <div>
      {/* ========================================================================= */}
      {/* 1. VERSÃO MOBILE                                                          */}
      {/* ========================================================================= */}
      <div className="md:hidden flex flex-col space-y-4">
        {groupedMobile.length > 0 ? (
          <div className="rounded-2xl border border-border/60 bg-card overflow-hidden shadow-sm divide-y divide-border/30">
            {groupedMobile.map((group) => (
              <div key={group.dateKey} className="flex flex-col">
                <div className="bg-[#18181b] text-[#9e9ea3] text-[13px] font-semibold px-4 py-2.5 border-y border-border/40 select-none">
                  {formatGroupHeader(group.dateKey)}
                </div>

                <div className="divide-y divide-border/30">
                  {group.items.map((t) => {
                    const isTransfer = t.type === "TRANSFER";
                    const IconComponent = isTransfer ? ArrowRightLeft : (t.category ? getCategoryIconComponent(t.category.name) : Tag);
                    const seriesBadge = isSeries(t) ? "Parcelado" : "Único";
                    return (
                      <div
                        key={t.id}
                        onClick={() => setSelectedTx(t)}
                        className="group/item flex items-center justify-between p-4 hover:bg-muted/40 transition-colors cursor-pointer select-none"
                      >
                        <div className="flex items-center min-w-0 pr-3">
                          <div
                            className="size-12 rounded-full flex items-center justify-center text-white shrink-0 shadow-sm transition-transform duration-200 group-hover/item:scale-105"
                            style={{ backgroundColor: isTransfer ? "#3b82f6" : (t.category?.color || "#b300e4") }}
                          >
                            <IconComponent className="w-6 h-6 stroke-[2.2]" />
                          </div>

                          <div className="flex flex-col pl-3.5 min-w-0">
                            <p className="text-foreground font-bold text-base leading-tight truncate max-w-[170px] sm:max-w-[240px]">
                              {t.description || (isTransfer ? "Transferência" : "Transação")}
                            </p>
                            <div className="flex items-center gap-1 text-[#84848a] text-xs font-medium mt-1">
                              {isTransfer ? (
                                <span className="truncate max-w-[150px]">
                                  {t.account?.name} → {t.destinationAccount?.name}
                                </span>
                              ) : (
                                <>
                                  <span className="truncate max-w-[130px]">
                                    {t.account?.name || "Carteira"}
                                  </span>
                                  {t.account?.type === "CARTAO" && (
                                    <CreditCardIcon className="w-3.5 h-3.5 text-[#84848a]/90 inline shrink-0 ml-0.5" />
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-end shrink-0">
                          <span
                            className={`font-extrabold tabular-nums text-base whitespace-nowrap tracking-tight ${
                              t.type === "INCOME" ? "text-emerald-400" : (isTransfer ? "text-blue-400" : "text-rose-500")
                            }`}
                          >
                            {t.type === "INCOME" ? "R$ " : (isTransfer ? "R$ " : "-R$ ")}
                            {formatNumberOnly(t.amount)}
                          </span>

                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[#84848a] text-xs font-medium">
                              {seriesBadge}
                            </span>
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTogglePaid(t.id, t.paid);
                              }}
                              title={t.paid ? "Pago (clique para alterar)" : "Pendente (clique para alterar)"}
                              className={`size-2.5 rounded-full cursor-pointer transition-transform hover:scale-125 ${
                                t.paid ? "bg-emerald-500 shadow-2xs shadow-emerald-500/50" : "bg-amber-400 animate-pulse"
                              }`}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-16 px-4 text-center bg-card rounded-2xl border border-border/60 text-muted-foreground">
            <Calendar className="mx-auto h-12 w-12 mb-3 opacity-20 text-[#b300e4]" />
            <p className="font-semibold text-foreground">Nenhuma transação neste período</p>
            <p className="text-xs mt-1">Clique no botão abaixo ou no topo para cadastrar.</p>
          </div>
        )}

        <div className="fixed bottom-16 left-0 right-0 z-30 bg-[#18181b]/95 backdrop-blur-md border-t border-border/70 px-5 py-3 shadow-2xl shadow-black/90 flex flex-col justify-between">
          <div className="w-full flex items-center justify-center pb-1">
            <ChevronUp className="w-4 h-4 text-muted-foreground/50 hover:text-foreground transition-colors" />
          </div>
          <div className="flex items-center justify-between w-full">
            <span className="text-sm font-semibold text-[#a0a0a5]">Balanço total</span>
            <span className="text-base font-extrabold tabular-nums text-foreground">
              {formatCurrency(calcBalance)}
            </span>
          </div>
        </div>
      </div>

      {/* Modal / Pop-up de Detalhes da Transação */}
      {selectedTx && (() => {
        const match = selectedTx.description.match(/\((\d+)\/(\d+)\)/);
        const isInstallment = !!match;
        const currentInstallment = isInstallment ? parseInt(match[1]) : 0;
        const totalInstallments = isInstallment ? parseInt(match[2]) : 0;
        const progressPercentage = isInstallment ? Math.round((currentInstallment / totalInstallments) * 100) : 0;
        const isFixedTransaction = isSeries(selectedTx) && !isInstallment;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in-0 p-3">
            <div 
              className="w-full max-w-md bg-[#18181b] border border-border/80 rounded-3xl p-5 shadow-2xl space-y-5 text-foreground animate-in zoom-in-95"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-2 border-b border-border/40">
                <div className="flex items-center gap-3">
                  <div 
                    className="size-10 rounded-full flex items-center justify-center text-white font-bold shrink-0 shadow-sm"
                    style={{ backgroundColor: selectedTx.category?.color || "#b300e4" }}
                  >
                    {(() => {
                      const IconComp = selectedTx.category ? getCategoryIconComponent(selectedTx.category.name) : Tag;
                      return <IconComp className="w-5 h-5" />;
                    })()}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-lg leading-tight">
                      {isInstallment ? selectedTx.description.replace(/\s*\(\d+\/\d+\)$/, "") : selectedTx.description}
                    </h3>
                    <p className="text-xs text-muted-foreground">{selectedTx.category?.name || "Sem categoria"} • {selectedTx.account?.name || "Carteira"}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedTx(null)} className="p-1.5 bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors rounded-full cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {isFixedTransaction && (
                <div className="flex items-center justify-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 py-1.5 px-3 rounded-lg w-fit mx-auto shadow-inner shadow-emerald-500/10">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Assinatura Ativa (Fixa)</span>
                </div>
              )}

              {isInstallment && (
                <div className="px-2 space-y-2">
                  <div className="flex justify-between text-xs font-semibold text-muted-foreground">
                    <span>Parcela {currentInstallment} de {totalInstallments}</span>
                    <span>{progressPercentage}% Pago</span>
                  </div>
                  <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden border border-border/50">
                    <div 
                      className="h-full bg-[#b300e4] rounded-full transition-all duration-500 shadow-[0_0_10px_#b300e4]" 
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="text-center py-4 bg-muted/20 rounded-2xl border border-border/40 shadow-inner">
                <span className="text-xs text-muted-foreground block uppercase font-semibold mb-1">Valor Registrado</span>
                <span className={`text-4xl font-black tabular-nums tracking-tight ${selectedTx.type === "INCOME" ? "text-emerald-400" : "text-rose-500"}`}>
                  {selectedTx.type === "INCOME" ? "+ " : "- "}
                  {formatCurrency(selectedTx.amount)}
                </span>
              </div>

              <div className="space-y-2.5 pt-2">
                <button
                  onClick={() => {
                    handleTogglePaid(selectedTx.id, selectedTx.paid);
                    setSelectedTx(null);
                  }}
                  className={`w-full py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 border transition-all cursor-pointer shadow-sm ${
                    selectedTx.paid 
                      ? "bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20"
                      : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                  }`}
                >
                  {selectedTx.paid ? (
                    <><Clock className="w-4 h-4" /> Alterar para Pendente</>
                  ) : (
                    <><CheckCircle2 className="w-4 h-4" /> Confirmar Pagamento</>
                  )}
                </button>

                <div className="grid grid-cols-2 gap-2.5">
                  <button 
                    onClick={() => {
                      const target = selectedTx;
                      setSelectedTx(null);
                      handleEditClick(target);
                    }}
                    className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-card hover:bg-muted text-foreground border border-border/80 flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
                  >
                    <Edit2 className="w-4 h-4 text-[#b300e4]" /> Editar
                  </button>

                  <button
                    onClick={() => {
                      const target = selectedTx;
                      setSelectedTx(null);
                      handleDeleteClick(target);
                    }}
                    className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
                  >
                    <Trash2 className="w-4 h-4" /> Excluir
                  </button>
                </div>

                {(isFixedTransaction || isInstallment) && (
                  <button
                    onClick={async () => {
                      if(confirm(isFixedTransaction ? "Deseja realmente cancelar esta Assinatura Fixa? Isso irá apagar todas as cobranças futuras que ainda não foram pagas." : "Deseja realmente apagar esta e todas as outras parcelas vinculadas?")) {
                        setIsDeleting(true);
                        await deleteTransaction(selectedTx.id, true);
                        setIsDeleting(false);
                        setSelectedTx(null);
                      }
                    }}
                    className="w-full py-3.5 px-4 mt-2 rounded-xl font-extrabold text-sm bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/25 flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer"
                  >
                    <span>{isFixedTransaction ? "🚫 Cancelar Conta Fixa (Excluir Futuras)" : "💥 Cancelar Série de Parcelas"}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}


      {/* ========================================================================= */}
      {/* 2. VERSÃO DESKTOP                                                         */}
      {/* ========================================================================= */}
      <div className="hidden md:flex flex-col space-y-6">
        <div className="grid grid-cols-3 gap-6">
          <div className="bg-card border border-border/70 rounded-2xl p-5 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Total de Entradas</span>
              <p className="text-2xl font-black text-emerald-400 mt-1 tabular-nums">{formatCurrency(calcIncome)}</p>
            </div>
            <div className="size-12 rounded-2xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center shadow-inner">
              <ArrowUpRight className="h-6 w-6 stroke-[2.5]" />
            </div>
          </div>

          <div className="bg-card border border-border/70 rounded-2xl p-5 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Total de Saídas</span>
              <p className="text-2xl font-black text-rose-500 mt-1 tabular-nums">{formatCurrency(calcExpense)}</p>
            </div>
            <div className="size-12 rounded-2xl bg-rose-500/15 text-rose-500 flex items-center justify-center shadow-inner">
              <ArrowDownLeft className="h-6 w-6 stroke-[2.5]" />
            </div>
          </div>

          <div className="bg-card border border-border/70 rounded-2xl p-5 shadow-xs flex items-center justify-between border-l-4 border-l-[#b300e4]">
            <div>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Balanço do Período</span>
              <p className={`text-2xl font-black mt-1 tabular-nums ${calcBalance >= 0 ? "text-foreground" : "text-red-500"}`}>
                {formatCurrency(calcBalance)}
              </p>
            </div>
            <div className="size-12 rounded-2xl bg-[#b300e4]/15 text-[#b300e4] flex items-center justify-center shadow-inner">
              <TrendingUp className="h-6 w-6 stroke-[2.5]" />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between bg-card border border-border/70 rounded-2xl p-3 px-4 shadow-2xs gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por descrição, categoria ou conta..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-muted/30 border border-border/80 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#b300e4]/60 transition-all"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 bg-muted/40 p-1 rounded-xl border border-border/50">
            {[
              { id: "all", label: "Todas" },
              { id: "income", label: "Entradas" },
              { id: "expense", label: "Saídas" },
              { id: "pending", label: "Pendentes" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterType(tab.id as any)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  filterType === tab.id
                    ? "bg-[#b300e4] text-white shadow-md shadow-[#b300e4]/20 scale-[1.02]"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-hidden border border-border/70 bg-card rounded-2xl shadow-xs">
          {groupedDesktop.length > 0 ? (
            <div className="w-full overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground font-semibold uppercase text-[11px] tracking-wider border-b border-border/70">
                  <tr>
                    <th className="px-6 py-3.5 w-40">Categoria & Descrição</th>
                    <th className="px-6 py-3.5">Conta / Cartão</th>
                    <th className="px-6 py-3.5 w-32">Recorrência</th>
                    <th className="px-6 py-3.5 text-center w-36">Status</th>
                    <th className="px-6 py-3.5 text-right w-44">Valor</th>
                    <th className="px-6 py-3.5 w-20 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {groupedDesktop.map((group) => (
                    <React.Fragment key={group.dateKey}>
                      <tr className="bg-[#18181b]/90 text-[#a0a0a5] font-bold text-xs border-y border-border/40">
                        <td colSpan={6} className="px-6 py-2.5 tracking-wide uppercase">
                          {formatGroupHeader(group.dateKey)}
                        </td>
                      </tr>

                      {group.items.map((t) => {
                        const isTransfer = t.type === "TRANSFER";
                        const IconComponent = isTransfer ? ArrowRightLeft : (t.category ? getCategoryIconComponent(t.category.name) : Tag);
                        const seriesBadge = isSeries(t) ? "Parcelado/Série" : "Único";
                        return (
                          <tr 
                            key={t.id} 
                            onClick={() => setSelectedTx(t)}
                            className="group hover:bg-muted/30 transition-colors cursor-pointer"
                          >
                            <td className="px-6 py-4 align-middle">
                              <div className="flex items-center gap-3.5">
                                <div
                                  className="size-10 rounded-full flex items-center justify-center text-white shrink-0 shadow-sm transition-transform duration-200 group-hover:scale-105"
                                  style={{ backgroundColor: isTransfer ? "#3b82f6" : (t.category?.color || "#b300e4") }}
                                >
                                  <IconComponent size={18} className="stroke-[2.5]" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-foreground font-extrabold text-sm truncate max-w-[250px] group-hover:text-[#b300e4] transition-colors">
                                    {t.description || (isTransfer ? "Transferência" : "Transação")}
                                  </p>
                                  <p className="text-muted-foreground text-xs font-semibold mt-0.5">
                                    {isTransfer ? "Transferência" : (t.category?.name || "Sem categoria")}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="px-6 py-4 align-middle">
                              {isTransfer ? (
                                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-muted/40 border border-border/60">
                                  <ArrowRightLeft className="w-3.5 h-3.5 text-blue-500" />
                                  <span className="text-foreground font-semibold text-xs truncate max-w-[130px]" title={`${t.account?.name} para ${t.destinationAccount?.name}`}>
                                    {t.account?.name} → {t.destinationAccount?.name}
                                  </span>
                                </div>
                              ) : (
                                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-muted/40 border border-border/60">
                                  <img
                                    src={getBankIcon(t.account?.name || "")}
                                    alt={t.account?.name}
                                    className="h-4 w-4 object-contain rounded-full"
                                  />
                                  <span className="text-foreground font-semibold text-xs truncate max-w-[130px]">
                                    {t.account?.name || "Carteira"}
                                  </span>
                                </div>
                              )}
                            </td>

                            <td className="px-6 py-4 align-middle">
                              <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold ${
                                isSeries(t) ? "bg-[#b300e4]/15 text-[#b300e4] border border-[#b300e4]/30" : "text-muted-foreground"
                              }`}>
                                {seriesBadge}
                              </span>
                            </td>

                            <td className="px-6 py-4 align-middle text-center">
                              <button
                                onClick={(e) => { e.stopPropagation(); handleTogglePaid(t.id, t.paid); }}
                                disabled={loadingId === t.id}
                                className={`inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-all duration-200 cursor-pointer shadow-2xs hover:scale-105 active:scale-95 disabled:opacity-50 ${
                                  t.paid
                                    ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25 hover:border-emerald-500/50"
                                    : "bg-amber-500/15 text-amber-400 border-amber-500/30 hover:bg-amber-500/25 hover:border-amber-500/50"
                                }`}
                              >
                                {loadingId === t.id ? (
                                  <span className="size-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
                                ) : t.paid ? (
                                  <><CheckCircle2 className="w-3.5 h-3.5" /> Pago</>
                                ) : (
                                  <><Clock className="w-3.5 h-3.5" /> Pendente</>
                                )}
                              </button>
                            </td>

                            <td className="px-6 py-4 align-middle text-right">
                              <span
                                className={`font-black tabular-nums text-base whitespace-nowrap ${
                                  t.type === "INCOME" ? "text-emerald-400" : (t.type === "TRANSFER" ? "text-blue-400" : "text-rose-500")
                                }`}
                              >
                                {t.type === "INCOME" ? "R$ " : (t.type === "TRANSFER" ? "R$ " : "-R$ ")}{formatNumberOnly(t.amount)}
                              </span>
                            </td>

                            <td className="px-6 py-4 align-middle text-right">
                              <div className="flex items-center justify-end gap-1.5 opacity-40 group-hover:opacity-100 transition-opacity">
                                <button 
                                  title="Editar transação" 
                                  onClick={(e) => { e.stopPropagation(); handleEditClick(t); }}
                                  className="p-2 hover:bg-muted/80 rounded-xl text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                                >
                                  <Edit2 size={16} />
                                </button>
                                <button
                                  title="Excluir transação"
                                  onClick={(e) => { e.stopPropagation(); handleDeleteClick(t); }}
                                  className="p-2 hover:bg-rose-500/15 rounded-xl text-muted-foreground hover:text-rose-500 transition-colors cursor-pointer"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-16 text-center text-muted-foreground bg-card">
              <Calendar className="mx-auto h-12 w-12 mb-4 opacity-20 text-[#b300e4]" />
              <p className="font-bold text-foreground text-base">Nenhuma transação encontrada</p>
              <p className="text-xs mt-1">Nenhum registro corresponde ao filtro selecionado para este mês.</p>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. MODAIS DE EXCLUSÃO E EDIÇÃO EM SÉRIE                                   */}
      {/* ========================================================================= */}

      {/* Modal de Exclusão (Única vs Todas as Parcelas) */}
      {deleteModalTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in-0">
          <div className="w-full max-w-md bg-[#18181b] border border-border/80 rounded-3xl p-6 shadow-2xl space-y-5 text-foreground animate-in zoom-in-95">
            <div className="flex items-center gap-3.5 pb-3 border-b border-border/40">
              <div className="size-11 rounded-2xl bg-rose-500/15 text-rose-500 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div>
                <h3 className="font-extrabold text-lg leading-tight">Excluir Lançamento</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{deleteModalTx.description}</p>
              </div>
            </div>

            {isSeries(deleteModalTx) ? (
              <div className="space-y-3">
                <p className="text-sm font-medium text-muted-foreground leading-relaxed">
                  Este lançamento faz parte de um <strong>parcelamento ou série recorrente</strong>. Como deseja realizar a exclusão?
                </p>
                <div className="space-y-2.5 pt-2">
                  <button
                    disabled={isDeleting}
                    onClick={async () => {
                      setIsDeleting(true);
                      await deleteTransaction(deleteModalTx.id, false);
                      setIsDeleting(false);
                      setDeleteModalTx(null);
                    }}
                    className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-card hover:bg-muted text-foreground border border-border/80 flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    🗑️ Excluir apenas esta parcela (Mês atual)
                  </button>

                  <button
                    disabled={isDeleting}
                    onClick={async () => {
                      setIsDeleting(true);
                      await deleteTransaction(deleteModalTx.id, true);
                      setIsDeleting(false);
                      setDeleteModalTx(null);
                    }}
                    className="w-full py-3 px-4 rounded-xl font-extrabold text-sm bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                  >
                    💥 Excluir TODAS as parcelas desta série
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm font-medium text-muted-foreground leading-relaxed">
                  Tem certeza que deseja excluir permanentemente esta transação do sistema? Esta ação não poderá ser desfeita.
                </p>
                <button
                  disabled={isDeleting}
                  onClick={async () => {
                    setIsDeleting(true);
                    await deleteTransaction(deleteModalTx.id, false);
                    setIsDeleting(false);
                    setDeleteModalTx(null);
                  }}
                  className="w-full py-3 px-4 rounded-xl font-extrabold text-sm bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  Confirmar Exclusão
                </button>
              </div>
            )}

            <button
              disabled={isDeleting}
              onClick={() => setDeleteModalTx(null)}
              className="w-full py-2.5 rounded-xl font-bold text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              Cancelar e Voltar
            </button>
          </div>
        </div>
      )}

      {/* Modal de Edição (Única vs Todas as Parcelas) */}
      {editModalTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in-0">
          <div className="w-full max-w-md bg-[#18181b] border border-border/80 rounded-3xl p-6 shadow-2xl space-y-5 text-foreground animate-in zoom-in-95">
            <div className="flex items-center gap-3.5 pb-3 border-b border-border/40">
              <div className="size-11 rounded-2xl bg-[#b300e4]/15 text-[#b300e4] flex items-center justify-center shrink-0">
                <Edit2 className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div>
                <h3 className="font-extrabold text-lg leading-tight">Editar Lançamento em Série</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{editModalTx.description}</p>
              </div>
            </div>

            <p className="text-sm font-medium text-muted-foreground leading-relaxed">
              Esta transação faz parte de uma <strong>série parcelada ou recorrente</strong>. Deseja alterar apenas as informações desta parcela específica ou aplicar a alteração para todas?
            </p>

            <div className="space-y-2.5 pt-1">
              <button
                onClick={() => {
                  router.push(`/transactions/edit/${editModalTx.id}?mode=single`);
                  setEditModalTx(null);
                }}
                className="w-full py-3.5 px-4 rounded-2xl font-bold text-sm bg-card hover:bg-muted text-foreground border border-border/80 flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer"
              >
                <span>✏️ Editar apenas esta parcela</span>
                <span className="text-[11px] font-normal text-muted-foreground">Altera somente o registro deste mês</span>
              </button>

              <button
                onClick={() => {
                  router.push(`/transactions/edit/${editModalTx.id}?mode=series`);
                  setEditModalTx(null);
                }}
                className="w-full py-3.5 px-4 rounded-2xl font-extrabold text-sm bg-[#b300e4] hover:bg-[#b300e4]/90 text-white shadow-lg shadow-[#b300e4]/25 flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer"
              >
                <span>🚀 Editar TODAS as parcelas da série</span>
                <span className="text-[11px] font-medium text-white/80">Aplica novo valor, categoria e conta a todos os meses</span>
              </button>
            </div>

            <button
              onClick={() => setEditModalTx(null)}
              className="w-full py-2 rounded-xl font-bold text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
