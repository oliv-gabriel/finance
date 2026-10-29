"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { getCardInvoiceDetails } from "@/app/actions/accounts";
import { payCardBill, toggleTransactionPaid } from "@/app/actions/transactions";
import { 
  X, ChevronLeft, ChevronRight, Calendar, CreditCard as CreditCardIcon, 
  CheckCircle2, Clock, Loader2, TrendingUp, DollarSign, Percent, Tag, ShieldCheck,
  Pencil, ChevronDown
} from "lucide-react";
import { getBankIcon } from "@/lib/icons";

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
  availableAccounts: { id: string; name: string; balance?: number }[];
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
      seriesId?: string | null;
    }[];
  };
}

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

export default function CardInvoiceModal({ isOpen, onClose, cardId, initialMonth, initialYear }: CardInvoiceModalProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [month, setMonth] = useState(initialMonth);
  const [year, setYear] = useState(initialYear);
  const [data, setData] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [paying, setPaying] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [actionTx, setActionTx] = useState<InvoiceData["invoice"]["transactions"][0] | null>(null);

  const isSeries = (tx: { description: string; seriesId?: string | null }) => {
    return Boolean(tx.seriesId || /\(\d+\/\d+\)/.test(tx.description));
  };

  const handleRowClick = (tx: InvoiceData["invoice"]["transactions"][0]) => {
    if (isSeries(tx)) {
      setActionTx(tx);
    } else {
      onClose();
      router.push(`/transactions/edit/${tx.id}`);
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setMonth(initialMonth);
      setYear(initialYear);
    }
  }, [isOpen, initialMonth, initialYear]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

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
      if (result?.availableAccounts?.length && !selectedAccountId) {
        setSelectedAccountId(result.availableAccounts[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !cardId || !mounted) return null;

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
    
    const amountToPay = Math.max(0, data.invoice.totalSpent - data.invoice.totalPaid);
    if (amountToPay > 0 && !selectedAccountId) {
      alert("Por favor, selecione a conta de onde o dinheiro sairá.");
      return;
    }

    if (!confirm(`Confirmar o pagamento da fatura de ${MONTH_NAMES[month - 1]}?`)) return;

    setPaying(true);
    try {
      const res = await payCardBill(cardId, month, year, selectedAccountId);
      if (res && !res.success) {
        alert(res.error || "Erro ao pagar fatura");
      } else {
        await loadData(cardId, month, year);
        router.refresh();
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao processar pagamento");
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
    const day = String(d.getDate()).padStart(2, "0");
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const y = d.getFullYear();
    return `${day}/${m}/${y}`;
  };

  return createPortal(
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 md:p-6 animate-in fade-in-0 duration-200 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-3xl rounded-3xl bg-[#121212] border border-border/80 shadow-2xl shadow-[#b300e4]/15 overflow-hidden flex flex-col max-h-[90vh] text-foreground my-auto shrink-0"
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-3 bg-muted/20 border-b border-border/40 gap-2">
          <div className="flex items-center justify-between sm:justify-start gap-2 w-full sm:w-auto">
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

          {data?.invoice && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground self-center sm:self-auto">
              <span>Período: <strong className="text-foreground">{formatDate(data.invoice.startDate)}</strong> a <strong className="text-foreground">{formatDate(data.invoice.endDate)}</strong></span>
              <span>•</span>
              <span className={`inline-flex items-center gap-1 font-semibold ${
                data.invoice.isPaid 
                  ? "text-emerald-400" 
                  : new Date() <= new Date(data.invoice.endDate) 
                  ? "text-green-500" 
                  : "text-red-400"
              }`}>
                {data.invoice.isPaid 
                  ? "Fatura Paga" 
                  : new Date() <= new Date(data.invoice.endDate) 
                  ? "Em Aberto" 
                  : "Fechada"}
              </span>
            </div>
          )}
        </div>

        {/* Corpo do Modal */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.15)_transparent]">
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
                  <div className="rounded-2xl border border-border/70 bg-card overflow-hidden divide-y divide-border/30 max-h-[280px] sm:max-h-[340px] overflow-y-auto shadow-inner [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.15)_transparent]">
                    {data.invoice.transactions.map((tx) => (
                      <div 
                        key={tx.id} 
                        onClick={() => handleRowClick(tx)}
                        title="Clique para editar este lançamento"
                        className="flex items-center justify-between p-3.5 hover:bg-muted/60 hover:border-l-4 hover:border-l-[#b300e4] transition-all cursor-pointer group/tx select-none"
                      >
                        <div className="flex items-center gap-3 min-w-0 pr-2">
                          <div className="size-9 rounded-xl bg-[#b300e4]/10 text-[#b300e4] flex items-center justify-center shrink-0 font-bold group-hover/tx:scale-105 transition-transform">
                            <Tag className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-sm font-bold text-foreground truncate group-hover/tx:text-[#b300e4] transition-colors">
                                {tx.description || "Compra no cartão"}
                              </p>
                              {isSeries(tx) && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/5 border border-white/10 text-zinc-400 font-medium shrink-0">
                                  Parcelado
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                              <span>{formatDate(tx.date)}</span>
                              <span>•</span>
                              <span className="font-semibold text-foreground/80">{tx.categoryName}</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0 flex items-center">
                          <div className="flex flex-col items-end">
                            <p className="text-sm font-bold tabular-nums text-red-400">
                              - {formatCurrency(tx.amount)}
                            </p>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleTx(tx.id, tx.paid);
                              }}
                              title={tx.paid ? "Clique para alterar para Em aberto" : "Clique para alterar para Pago"}
                              className={`text-[11px] font-semibold flex items-center justify-end gap-1.5 mt-1 px-2.5 py-0.5 rounded-full border transition-all cursor-pointer ${
                                togglingId === tx.id
                                  ? "bg-muted text-muted-foreground border-border"
                                  : tx.paid 
                                  ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25" 
                                  : "bg-amber-500/15 text-amber-400 border-amber-500/30 hover:bg-amber-500/25"
                              }`}
                            >
                              {togglingId === tx.id ? (
                                <><Loader2 className="w-3 h-3 animate-spin" /> Atualizando...</>
                              ) : tx.paid ? (
                                <><CheckCircle2 className="w-3 h-3" /> Pago</>
                              ) : (
                                <><Clock className="w-3 h-3" /> Em aberto</>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-border/60 bg-card p-8 text-center flex flex-col items-center justify-center gap-2.5">
                    <p className="text-muted-foreground text-sm font-medium">
                      Nenhuma compra registrada nesta fatura ({formatDate(data.invoice.startDate)} a {formatDate(data.invoice.endDate)}).
                    </p>
                    {data.card.closingDay && (
                      <p className="text-xs text-muted-foreground/80 max-w-md">
                        Esta fatura fechou no dia {data.card.closingDay?.toString().padStart(2, "0")}. Compras realizadas após o fechamento entram na fatura do mês seguinte.
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={handleNextMonth}
                      className="mt-2 text-xs font-semibold text-[#b300e4] hover:text-[#b300e4]/80 flex items-center gap-1 bg-[#b300e4]/10 hover:bg-[#b300e4]/20 px-3.5 py-2 rounded-xl transition-colors cursor-pointer"
                    >
                      <span>Ver fatura seguinte ({MONTH_NAMES[month === 12 ? 0 : month]})</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
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
            
            <div className="flex flex-col sm:flex-row w-full sm:w-auto items-center gap-3">
              {!data.invoice.isPaid && Math.max(0, data.invoice.totalSpent - data.invoice.totalPaid) > 0 && (
                <div className="relative w-full sm:w-auto min-w-[220px]">
                  <select
                    value={selectedAccountId}
                    onChange={(e) => setSelectedAccountId(e.target.value)}
                    className="w-full bg-[#1c1c1f] text-xs font-semibold text-foreground border border-border/80 rounded-xl pl-3 pr-8 py-3 focus:outline-none focus:ring-2 focus:ring-[#b300e4]/50 cursor-pointer appearance-none shadow-sm"
                  >
                    <option value="" disabled>Selecione a conta</option>
                    {data.availableAccounts?.map(acc => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} ({formatCurrency(acc.balance ?? 0)})
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>
              )}

              <button
                onClick={handlePayBill}
                disabled={paying || data.invoice.totalSpent === 0 || data.invoice.isPaid}
                className={`w-full sm:w-auto px-6 py-3 rounded-2xl font-extrabold text-sm transition-all duration-300 shadow-lg flex items-center justify-center gap-2 ${
                  data.invoice.isPaid
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 cursor-default shadow-none"
                    : data.invoice.totalSpent === 0
                    ? "bg-muted text-muted-foreground cursor-not-allowed opacity-50 shadow-none"
                    : "text-white cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none bg-[#b300e4] hover:bg-[#b300e4]/90 shadow-[#b300e4]/30 hover:shadow-[#b300e4]/50 hover:scale-[1.02] active:scale-[0.98]"
                }`}
              >
                {paying ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Registrando...</>
                ) : data.invoice.isPaid ? (
                  <><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Fatura Paga</>
                ) : data.invoice.totalSpent === 0 ? (
                  <>Sem Lançamentos</>
                ) : (
                  <>Pagar Fatura Completa</>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Escolha de Edição de Lançamento */}
      {actionTx && (
        <div 
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in-0"
          onClick={() => setActionTx(null)}
        >
          <div 
            className="w-full max-w-sm rounded-2xl bg-[#18181b] border border-white/10 p-5 shadow-2xl space-y-4 animate-in zoom-in-95 text-foreground"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div className="flex items-center gap-2.5 min-w-0 pr-2">
                <div className="p-2 rounded-xl bg-[#b300e4]/15 text-[#b300e4] shrink-0">
                  <Pencil className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-white">Editar Lançamento</h3>
                  <p className="text-xs text-zinc-400 truncate">{actionTx.description}</p>
                </div>
              </div>
              <button 
                onClick={() => setActionTx(null)}
                className="text-zinc-500 hover:text-white shrink-0 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-zinc-400">
                {isSeries(actionTx) 
                  ? "Este lançamento pertence a uma compra parcelada. Escolha como deseja editar:" 
                  : "Deseja editar as informações deste lançamento?"}
              </p>

              {isSeries(actionTx) ? (
                <>
                  <button
                    onClick={() => {
                      const targetId = actionTx.id;
                      setActionTx(null);
                      onClose();
                      router.push(`/transactions/edit/${targetId}?mode=single`);
                    }}
                    className="w-full text-left p-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 transition-colors text-xs font-medium text-white flex items-center justify-between cursor-pointer"
                  >
                    <div>
                      <p className="font-semibold text-white">Editar apenas esta parcela</p>
                      <p className="text-[11px] text-zinc-400 mt-0.5">Altera somente o valor ou dados deste mês</p>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      const targetId = actionTx.id;
                      setActionTx(null);
                      onClose();
                      router.push(`/transactions/edit/${targetId}?mode=series`);
                    }}
                    className="w-full text-left p-3 rounded-xl bg-[#b300e4] hover:bg-[#9a00c4] text-white transition-colors text-xs font-semibold flex items-center justify-between cursor-pointer"
                  >
                    <div>
                      <p className="font-semibold text-white">Editar toda a série</p>
                      <p className="text-[11px] text-white/80 mt-0.5">Aplica a alteração a todas as parcelas pendentes</p>
                    </div>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    const targetId = actionTx.id;
                    setActionTx(null);
                    onClose();
                    router.push(`/transactions/edit/${targetId}`);
                  }}
                  className="w-full p-3 rounded-xl bg-[#b300e4] hover:bg-[#9a00c4] text-white transition-colors text-xs font-semibold text-center cursor-pointer"
                >
                  Abrir Edição do Lançamento
                </button>
              )}
            </div>

            <button
              onClick={() => setActionTx(null)}
              className="w-full py-1 text-xs text-zinc-400 hover:text-white font-medium cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}
