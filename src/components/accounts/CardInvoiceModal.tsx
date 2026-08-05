"use client";

import React, { useState, useEffect } from "react";
import { getCardInvoiceDetails } from "@/app/actions/accounts";
import { payCardBill, toggleTransactionPaid } from "@/app/actions/transactions";
import { 
  X, ChevronLeft, ChevronRight, Calendar, CreditCard as CreditCardIcon, 
  CheckCircle2, Clock, Loader2, TrendingUp, DollarSign, Percent, Tag, ShieldCheck
} from "lucide-react";

interface CardInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  cardId: string | null;
  initialMonth: number;
  initialYear: number;
}

interface InvoiceData {
  card: {
    id: string;
    name: string;
    limit: number;
    closingDay: number | null;
    dueDay: number | null;
    bankName: string;
  };
  invoice: {
    totalSpent: number;
    totalPaid: number;
    percentageUsed: number;
    startDate: string;
    endDate: string;
    isPaid: boolean;
    transactions: {
      id: string;
      description: string;
      amount: number;
      date: string;
      type: string;
      paid: boolean;
      categoryName: string;
      categoryColor: string;
    }[];
  };
}

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const getBankIcon = (name: string) => {
  const nameLower = name.toLowerCase();
  if (nameLower.includes("brasil") || nameLower === "bb") return "https://raw.githubusercontent.com/budgi-it/brazilian-financial-icons/835b29d98d5f30a57dfb6d8b20652f215e2e010a/banco-do-brasil.svg";
  if (nameLower.includes("99")) return "https://raw.githubusercontent.com/budgi-it/brazilian-financial-icons/835b29d98d5f30a57dfb6d8b20652f215e2e010a/99-pay.svg";
  if (nameLower.includes("nubank") || nameLower.includes("nu")) return "https://raw.githubusercontent.com/budgi-it/brazilian-financial-icons/835b29d98d5f30a57dfb6d8b20652f215e2e010a/nubank.svg";
  if (nameLower.includes("itau") || nameLower.includes("itaú")) return "https://raw.githubusercontent.com/budgi-it/brazilian-financial-icons/835b29d98d5f30a57dfb6d8b20652f215e2e010a/itau.svg";
  if (nameLower.includes("bradesco")) return "https://raw.githubusercontent.com/budgi-it/brazilian-financial-icons/835b29d98d5f30a57dfb6d8b20652f215e2e010a/bradesco.svg";
  if (nameLower.includes("inter")) return "https://raw.githubusercontent.com/budgi-it/brazilian-financial-icons/835b29d98d5f30a57dfb6d8b20652f215e2e010a/banco-inter.svg";
  if (nameLower.includes("santander")) return "https://raw.githubusercontent.com/budgi-it/brazilian-financial-icons/835b29d98d5f30a57dfb6d8b20652f215e2e010a/santander.svg";
  if (nameLower.includes("picpay")) return "https://cdn.despezzas.com.br/svgs/carteira.svg";
  return "https://cdn.despezzas.com.br/svgs/carteira.svg";
};

export default function CardInvoiceModal({ isOpen, onClose, cardId, initialMonth, initialYear }: CardInvoiceModalProps) {
  const [month, setMonth] = useState(initialMonth);
  const [year, setYear] = useState(initialYear);
  const [data, setData] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [paying, setPaying] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && cardId) {
      loadData(cardId, month, year);
    }
  }, [isOpen, cardId, month, year]);

  const loadData = async (targetCardId: string, m: number, y: number) => {
    setLoading(true);
    try {
      const result = await getCardInvoiceDetails(targetCardId, m, y);
      setData(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !cardId) return null;

  const handlePrevMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear(y => y - 1);
    } else {
      setMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear(y => y + 1);
    } else {
      setMonth(m => m + 1);
    }
  };

  const handlePayBill = async () => {
    if (!cardId || !data) return;
    if (!confirm(`Confirmar o pagamento da fatura de ${MONTH_NAMES[month - 1]}?`)) return;

    setPaying(true);
    try {
      await payCardBill(cardId, month, year);
      await loadData(cardId, month, year);
    } catch (err) {
      console.error(err);
    } finally {
      setPaying(false);
    }
  };

  const handleToggleTx = async (txId: string, currentPaid: boolean) => {
    if (!cardId || togglingId) return;
    setTogglingId(txId);
    try {
      await toggleTransactionPaid(txId, !currentPaid);
      await loadData(cardId, month, year);
    } catch (err) {
      console.error(err);
    } finally {
      setTogglingId(null);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" }).format(d);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 md:p-6 animate-in fade-in-0 duration-200">
      <div 
        className="w-full max-w-3xl rounded-3xl bg-[#121212] border border-border/80 shadow-2xl shadow-[#b300e4]/15 overflow-hidden flex flex-col max-h-[92vh] text-foreground"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border/60 bg-card/60 backdrop-blur">
          <div className="flex items-center gap-4">
            {data?.card && (
              <img
                alt={data.card.name}
                src={getBankIcon(data.card.name)}
                className="w-11 h-11 rounded-xl bg-background/80 object-contain p-1 border border-border/60 shadow-sm"
              />
            )}
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold tracking-tight text-foreground">
                  {data?.card ? data.card.name : "Carregando fatura..."}
                </h2>
                {data?.invoice?.isPaid && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Paga
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {data?.card?.closingDay 
                  ? `Fechamento dia ${data.card.closingDay.toString().padStart(2, '0')} • Vencimento dia ${(data.card.dueDay || 10).toString().padStart(2, '0')}`
                  : "Fechamento no final do mês"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer"
            title="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Filtro de Mês */}
        <div className="flex items-center justify-between px-6 py-3 bg-muted/20 border-b border-border/40">
          <button 
            onClick={handlePrevMonth}
            className="flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-[#b300e4] transition-colors p-1 rounded-lg hover:bg-muted/40 cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Anterior</span>
          </button>

          <div className="flex items-center gap-2">
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="bg-card font-bold text-sm text-foreground border border-border/80 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#b300e4] cursor-pointer"
            >
              {MONTH_NAMES.map((name, idx) => (
                <option key={idx + 1} value={idx + 1}>{name}</option>
              ))}
            </select>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="bg-card font-bold text-sm text-foreground border border-border/80 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#b300e4] cursor-pointer"
            >
              {[2025, 2026, 2027, 2028].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <button 
            onClick={handleNextMonth}
            className="flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-[#b300e4] transition-colors p-1 rounded-lg hover:bg-muted/40 cursor-pointer"
          >
            <span className="hidden sm:inline">Próximo</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Corpo do Modal */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-[#b300e4]" />
              <p className="text-sm text-muted-foreground font-medium">Calculando fatura do período...</p>
            </div>
          ) : data ? (
            <>
              {/* Grade de 4 Cards (Gasto, Pago, Limite, Datas) */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
                <div className="bg-card/90 rounded-2xl p-4 border border-border/60 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">Valor do Gasto</span>
                    <TrendingUp className="w-4 h-4 text-[#b300e4]" />
                  </div>
                  <div className="mt-2 text-lg md:text-xl font-black text-foreground tabular-nums">
                    {formatCurrency(data.invoice.totalSpent)}
                  </div>
                </div>

                <div className="bg-card/90 rounded-2xl p-4 border border-border/60 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">Valor Pago</span>
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="mt-2 text-lg md:text-xl font-bold text-emerald-400 tabular-nums">
                    {formatCurrency(data.invoice.totalPaid)}
                  </div>
                </div>

                <div className="bg-card/90 rounded-2xl p-4 border border-border/60 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">Limite Total</span>
                    <CreditCardIcon className="w-4 h-4 opacity-60" />
                  </div>
                  <div className="mt-2 text-lg md:text-xl font-bold text-foreground tabular-nums">
                    {formatCurrency(data.card.limit)}
                  </div>
                </div>

                <div className="bg-card/90 rounded-2xl p-4 border border-border/60 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">Vencimento</span>
                    <Calendar className="w-4 h-4 text-[#b300e4]" />
                  </div>
                  <div className="mt-2 text-base font-extrabold text-[#b300e4]">
                    Dia {data.card.dueDay || "10"}/{month.toString().padStart(2, "0")}
                  </div>
                </div>
              </div>

              {/* Barra de Progresso - Porcentagem do Limite */}
              <div className="bg-muted/30 rounded-2xl p-4 border border-border/50">
                <div className="flex items-center justify-between text-xs font-semibold mb-2">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Percent className="w-3.5 h-3.5 text-[#b300e4]" />
                    Uso do limite de crédito
                  </span>
                  <span className="text-foreground font-extrabold">{data.invoice.percentageUsed}%</span>
                </div>
                <div className="w-full h-3 bg-muted rounded-full overflow-hidden border border-border/30">
                  <div 
                    className="h-full bg-gradient-to-r from-[#b300e4] to-[#e056fd] rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(100, data.invoice.percentageUsed)}%` }}
                  />
                </div>
              </div>

              {/* Lista de Compras da Fatura */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-muted-foreground tracking-wide uppercase">
                  Lançamentos na Fatura ({data.invoice.transactions.length})
                </h3>
                
                {data.invoice.transactions.length > 0 ? (
                  <div className="rounded-2xl border border-border/70 bg-card overflow-hidden divide-y divide-border/30 max-h-[280px] sm:max-h-[340px] overflow-y-auto shadow-inner">
                    {data.invoice.transactions.map((tx) => (
                      <div 
                        key={tx.id} 
                        onClick={() => handleToggleTx(tx.id, tx.paid)}
                        title={tx.paid ? "Clique para alterar para Em aberto" : "Clique para alterar para Pago"}
                        className="flex items-center justify-between p-3.5 hover:bg-muted/60 hover:border-l-4 hover:border-l-[#b300e4] transition-all cursor-pointer group/tx select-none"
                      >
                        <div className="flex items-center gap-3 min-w-0 pr-2">
                          <div className="size-9 rounded-xl bg-[#b300e4]/10 text-[#b300e4] flex items-center justify-center shrink-0 font-bold">
                            <Tag className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-foreground truncate group-hover/tx:text-[#b300e4] transition-colors">{tx.description || "Compra no cartão"}</p>
                            <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                              <span>{formatDate(tx.date)}</span>
                              <span>•</span>
                              <span className="font-semibold text-foreground/80">{tx.categoryName}</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0 flex flex-col items-end">
                          <p className="text-sm font-bold tabular-nums text-red-400">
                            - {formatCurrency(tx.amount)}
                          </p>
                          <span className={`text-[11px] font-semibold flex items-center justify-end gap-1.5 mt-1 px-2.5 py-0.5 rounded-full border transition-all ${
                            togglingId === tx.id
                              ? "bg-muted text-muted-foreground border-border"
                              : tx.paid 
                              ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 group-hover/tx:bg-emerald-500/25 group-hover/tx:border-emerald-500/50" 
                              : "bg-amber-500/15 text-amber-400 border-amber-500/30 group-hover/tx:bg-amber-500/25 group-hover/tx:border-amber-500/50"
                          }`}>
                            {togglingId === tx.id ? (
                              <><Loader2 className="w-3 h-3 animate-spin" /> Atualizando...</>
                            ) : tx.paid ? (
                              <><CheckCircle2 className="w-3 h-3" /> Pago</>
                            ) : (
                              <><Clock className="w-3 h-3" /> Em aberto</>
                            )}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-border/60 bg-card p-10 text-center text-muted-foreground text-sm font-medium">
                    Nenhuma compra registrada nesta fatura.
                  </div>
                )}
              </div>
            </>
          ) : (
            <p className="text-center text-muted-foreground py-10">Cartão não encontrado.</p>
          )}
        </div>

        {/* Rodapé de Pagamento */}
        {data && !loading && (
          <div className="px-6 py-4 border-t border-border/60 bg-card/80 backdrop-blur flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-xs text-muted-foreground uppercase font-semibold block">Total a Pagar</span>
              <p className="text-lg font-black text-foreground">
                {formatCurrency(Math.max(0, data.invoice.totalSpent - data.invoice.totalPaid))}
              </p>
            </div>
            
            <button
              onClick={handlePayBill}
              disabled={paying || data.invoice.totalSpent === 0 || data.invoice.isPaid}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl font-extrabold text-sm text-white transition-all duration-300 shadow-lg cursor-pointer flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none bg-[#b300e4] hover:bg-[#b300e4]/90 shadow-[#b300e4]/30 hover:shadow-[#b300e4]/50 hover:scale-[1.02] active:scale-[0.98]"
            >
              {paying ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Registrando pagamento...</>
              ) : data.invoice.isPaid ? (
                <><CheckCircle2 className="w-4 h-4 text-white" /> Fatura Paga</>
              ) : (
                <>Pagar Fatura Completa</>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
