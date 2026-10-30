"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createTransaction, updateTransaction } from "@/app/actions/transactions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/Card";
import { Save, ArrowUpCircle, ArrowDownCircle, ArrowRightLeft, Calendar as CalendarIcon, Check } from "lucide-react";
import Link from "next/link";

interface Category {
  id: string;
  name: string;
  color: string;
}

interface Account {
  id: string;
  name: string;
  type: string;
}

interface TransactionFormProps {
  categories: Category[];
  accounts: Account[];
  initialData?: {
    id: string;
    description: string;
    amount: number;
    date: Date;
    type: string;
    categoryId?: string | null;
    paid: boolean;
    accountId?: string | null;
    destinationAccountId?: string | null;
  };
  initialEditMode?: "single" | "series";
  onSuccess?: () => void;
  onCancel?: () => void;
  isModal?: boolean;
}

export default function TransactionForm({ categories, accounts, initialData, initialEditMode, onSuccess, onCancel, isModal = false }: TransactionFormProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [updateAllInSeries, setUpdateAllInSeries] = useState(initialEditMode === "series");
  const hiddenDateInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    description: initialData?.description || "",
    amount: initialData 
      ? new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2 }).format(initialData.amount)
      : "0,00",
    date: initialData?.date ? new Date(initialData.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
    type: initialData?.type || "EXPENSE",
    categoryId: initialData?.categoryId || categories[0]?.id || "",
    paid: initialData?.paid ?? true,
    accountId: initialData?.accountId || "",
    destinationAccountId: (initialData as any)?.destinationAccountId || "",
    entryType: "unico",
    recurrenceFreq: "Mensal",
    quantity: 1,
    installmentValueType: "total",
  });

  const selectedAccount = accounts.find((a) => a.id === formData.accountId);
  const showRecurrence = !!selectedAccount && !initialData;

  // Máscara para Data (DD/MM/YYYY)
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 8) value = value.slice(0, 8);
    
    let formatted = value;
    if (value.length > 2) {
      formatted = value.slice(0, 2) + "/" + value.slice(2);
    }
    if (value.length > 4) {
      formatted = value.slice(0, 2) + "/" + value.slice(2, 4) + "/" + value.slice(4);
    }
    setFormData({ ...formData, date: formatted });
  };

  // Máscara para Valor (Moeda BRL)
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    const options = { minimumFractionDigits: 2 };
    const result = new Intl.NumberFormat("pt-BR", options).format(
      parseFloat(value) / 100
    );
    setFormData({ ...formData, amount: value ? result : "0,00" });
  };

  const handleNativeDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateValue = e.target.value;
    if (dateValue) {
      const parsedDate = new Date(dateValue + "T12:00:00");
      setFormData({ ...formData, date: parsedDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) });
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsPending(true);
    
    try {
      const [day, month, year] = formData.date.split("/");
      const parsedDate = new Date(`${year}-${month}-${day}T12:00:00`);
      const numericAmount = parseFloat(
        formData.amount.replace(/\./g, "").replace(",", ".")
      );

      const payload = {
        ...formData,
        amount: numericAmount,
        date: parsedDate,
      };

      const result = initialData 
        ? await updateTransaction(initialData.id, payload, updateAllInSeries)
        : await createTransaction(payload);
      
      if (result.success) {
        if (onSuccess) {
          onSuccess();
        } else {
          router.push("/transactions");
        }
      } else {
        alert(result.error);
        setIsPending(false);
      }
    } catch (error) {
      alert("Erro ao salvar. Verifique se os dados estão corretos.");
      setIsPending(false);
    }
  }
  return (
    <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
      <div className={`flex-1 space-y-4 sm:space-y-5 overflow-y-auto custom-scrollbar overscroll-contain ${isModal ? "px-4 sm:px-6 py-4" : ""}`}>
        {!isModal && (
          <div className="mb-6">
            <h2 className="text-xl font-bold text-white">{initialData ? "Editar Transação" : "Nova Transação"}</h2>
          </div>
        )}
        <div className="grid grid-cols-3 bg-zinc-900/90 p-1.5 rounded-2xl gap-1.5 border border-border/60">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, type: "EXPENSE" })}
              className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                formData.type === "EXPENSE" 
                  ? "bg-rose-500/20 text-rose-400 border border-rose-500/30 shadow-xs scale-[1.02]" 
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              }`}
            >
              <ArrowDownCircle className="h-4 w-4 shrink-0" />
              <span>Despesa</span>
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, type: "INCOME" })}
              className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                formData.type === "INCOME" 
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-xs scale-[1.02]" 
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              }`}
            >
              <ArrowUpCircle className="h-4 w-4 shrink-0" />
              <span>Receita</span>
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, type: "TRANSFER", paid: true })}
              className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                formData.type === "TRANSFER" 
                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/30 shadow-xs scale-[1.02]" 
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              }`}
            >
              <ArrowRightLeft className="h-4 w-4 shrink-0" />
              <span className="truncate">Transferir</span>
            </button>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground uppercase tracking-wider">Descrição</label>
            <Input
              required
              placeholder="Ex: Aluguel, Supermercado, Salário"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="h-11 sm:h-12 text-sm rounded-xl bg-muted/60 text-foreground border-border/80 focus:border-[#b300e4]"
            />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground uppercase tracking-wider">Valor</label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-xs sm:text-sm font-bold text-muted-foreground pointer-events-none select-none">
                  R$
                </span>
                <Input
                  required
                  type="text"
                  inputMode="numeric"
                  placeholder="0,00"
                  value={formData.amount}
                  onChange={handleAmountChange}
                  className="h-11 sm:h-12 pl-10 text-base sm:text-lg font-black tracking-tight rounded-xl bg-muted/60 text-foreground border-border/80 focus:border-[#b300e4] tabular-nums"
                />
              </div>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground uppercase tracking-wider">Data</label>
              <div className="relative group">
                <Input
                  required
                  type="text"
                  placeholder="DD/MM/AAAA"
                  value={formData.date}
                  onChange={handleDateChange}
                  className="h-11 sm:h-12 pr-11 text-sm font-semibold rounded-xl bg-muted/60 text-foreground border-border/80 focus:border-[#b300e4] tabular-nums"
                />
                <button
                  type="button"
                  onClick={() => hiddenDateInputRef.current?.showPicker()}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-muted-foreground hover:text-[#b300e4] transition-colors cursor-pointer"
                  title="Abrir calendário"
                >
                  <CalendarIcon className="h-4 w-4" />
                </button>
                <input
                  ref={hiddenDateInputRef}
                  type="date"
                  className="absolute inset-0 w-full h-full opacity-0 pointer-events-none"
                  onChange={handleNativeDateChange}
                  tabIndex={-1}
                />
              </div>
            </div>
          </div>

          {formData.type !== "TRANSFER" && (
            <div 
              onClick={() => setFormData({ ...formData, paid: !formData.paid })}
              className="flex items-center justify-between p-3.5 sm:p-4 rounded-xl border border-border/80 bg-muted/60 text-foreground hover:bg-zinc-900 transition-all cursor-pointer select-none"
            >
              <span className="text-sm sm:text-base font-bold text-foreground">
                {formData.type === "EXPENSE" ? "Pago" : "Recebido"}
              </span>

              <div 
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out ${
                  formData.paid ? "bg-[#b300e4] shadow-xs shadow-[#b300e4]/50" : "bg-zinc-700/80"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                    formData.paid ? "translate-x-5.5" : "translate-x-0.5"
                  }`}
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-bold text-foreground uppercase tracking-wider">{formData.type === "TRANSFER" ? "Conta de Origem" : "Conta ou Cartão"}</label>
            <select
              required
              className="flex h-11 sm:h-12 w-full rounded-xl border border-border/80 bg-muted/60 text-foreground px-3.5 text-sm font-medium text-foreground focus:border-[#b300e4] focus:outline-none transition-colors cursor-pointer"
              value={formData.accountId}
              onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
            >
              <option value="" disabled>Selecione uma conta ou cartão</option>
              {accounts.filter(a => a.type === "CONTA").length > 0 && (
                <optgroup label="Contas">
                  {accounts.filter(a => a.type === "CONTA").map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </optgroup>
              )}
              {accounts.filter(a => a.type === "CARTAO").length > 0 && (
                <optgroup label="Cartões de Crédito">
                  {accounts.filter(a => a.type === "CARTAO").map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          {formData.type === "TRANSFER" && (
            <div className="space-y-2 mt-4">
              <label className="text-xs font-bold text-foreground uppercase tracking-wider">Conta de Destino</label>
              <select
                required
                className="flex h-11 sm:h-12 w-full rounded-xl border border-border/80 bg-muted/60 text-foreground px-3.5 text-sm font-medium text-foreground focus:border-[#b300e4] focus:outline-none transition-colors cursor-pointer"
                value={formData.destinationAccountId}
                onChange={(e) => setFormData({ ...formData, destinationAccountId: e.target.value })}
              >
                <option value="" disabled>Selecione a conta de destino</option>
                {accounts.filter(a => a.type === "CONTA" && a.id !== formData.accountId).map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
          )}

          {showRecurrence && formData.type !== "TRANSFER" && (
            <div className="space-y-4 p-4 border rounded-md bg-muted/30 border-border">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Lançamento</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 bg-muted p-1 rounded-xl gap-1.5 border border-border/50">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, entryType: "unico", quantity: 1 })}
                    className={`flex items-center justify-center py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      formData.entryType === "unico" ? "bg-[#b300e4] text-white shadow-md shadow-[#b300e4]/20 scale-[1.02]" : "text-muted-foreground hover:bg-background/60 hover:text-foreground"
                    }`}
                  >
                    Único
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, entryType: "fixa", quantity: 120 })}
                    className={`flex items-center justify-center py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      formData.entryType === "fixa" ? "bg-[#b300e4] text-white shadow-md shadow-[#b300e4]/20 scale-[1.02]" : "text-muted-foreground hover:bg-background/60 hover:text-foreground"
                    }`}
                  >
                    Fixa
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, entryType: "recorrente", quantity: 2 })}
                    className={`flex items-center justify-center py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      formData.entryType === "recorrente" ? "bg-[#b300e4] text-white shadow-md shadow-[#b300e4]/20 scale-[1.02]" : "text-muted-foreground hover:bg-background/60 hover:text-foreground"
                    }`}
                  >
                    Recorrente
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, entryType: "parcelado", quantity: 2 })}
                    className={`flex items-center justify-center py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      formData.entryType === "parcelado" ? "bg-[#b300e4] text-white shadow-md shadow-[#b300e4]/20 scale-[1.02]" : "text-muted-foreground hover:bg-background/60 hover:text-foreground"
                    }`}
                  >
                    Parcelado
                  </button>
                </div>
              </div>

              {formData.entryType !== "unico" && formData.entryType !== "fixa" && (
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-white uppercase tracking-wide">
                      {formData.entryType === "recorrente" ? "Frequência" : "Frequência das parcelas"}
                    </label>
                    <select
                      className="flex h-10 w-full rounded-xl border border-border bg-background px-3 py-1 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#b300e4]/60 cursor-pointer"
                      value={formData.recurrenceFreq}
                      onChange={(e) => setFormData({ ...formData, recurrenceFreq: e.target.value })}
                    >
                      <option value="Mensal">Mensal</option>
                      <option value="Quinzenal">Quinzenal</option>
                      <option value="Bimestral">Bimestral</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-white uppercase tracking-wide">
                      {formData.entryType === "recorrente" ? "Quantidade de vezes" : "Número de parcelas (x)"}
                    </label>
                    <Input
                      type="number"
                      min={formData.entryType === "parcelado" ? 2 : 1}
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                      className="h-10 rounded-xl font-bold"
                    />
                  </div>
                </div>
              )}

              {formData.entryType === "parcelado" && (
                <div className="space-y-3 pt-3 border-t border-border/60">
                  <div 
                    onClick={() => {
                      setFormData({ 
                        ...formData, 
                        installmentValueType: formData.installmentValueType === "total" ? "parcela" : "total" 
                      });
                    }}
                    className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 border border-border/70 cursor-pointer transition-all select-none"
                  >
                    <div className={`size-5 rounded-full border-2 flex items-center justify-center transition-colors shrink-0 ${
                      formData.installmentValueType === "total" ? "border-[#b300e4] bg-[#b300e4] shadow-xs shadow-[#b300e4]/30" : "border-muted-foreground/60 bg-background"
                    }`}>
                      {formData.installmentValueType === "total" && <span className="size-2 rounded-full bg-white" />}
                    </div>
                    <div className="text-sm font-bold text-foreground">
                      <span>Considerar valor digitado como o <strong>Valor Total</strong> da compra</span>
                      <span className="block text-[11px] font-medium text-muted-foreground mt-0.5">
                        {formData.installmentValueType === "total" 
                          ? "O valor total (R$ " + formData.amount + ") será dividido igualmente entre as parcelas." 
                          : "Desmarcado: O valor de R$ " + formData.amount + " já é o custo individual de cada parcela."}
                      </span>
                    </div>
                  </div>

                  {/* Simulação em tempo real */}
                  {(() => {
                    const numVal = parseFloat(formData.amount.replace(/\./g, "").replace(",", ".")) || 0;
                    const qtd = formData.quantity > 0 ? formData.quantity : 1;
                    const valCada = formData.installmentValueType === "total" ? (numVal / qtd) : numVal;
                    const valTotalGeral = formData.installmentValueType === "total" ? numVal : (numVal * qtd);
                    const formatBRL = (val: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

                    return (
                      <div className="mt-2 p-3.5 bg-muted/40 border border-border/80 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-semibold text-foreground shadow-inner">
                        <div className="flex items-center gap-2">
                          <div className="size-8 rounded-xl bg-[#b300e4]/20 text-[#b300e4] flex items-center justify-center font-extrabold text-sm shrink-0">
                            %
                          </div>
                          <div>
                            <span className="text-muted-foreground block text-[10px] uppercase font-bold tracking-wide">Simulação do Lançamento</span>
                            <span className="text-[#b300e4] font-black text-base">{qtd}x de {formatBRL(valCada)}</span>
                          </div>
                        </div>
                        <div className="sm:text-right w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-0 border-border/40 flex sm:block justify-between items-center">
                          <span className="text-muted-foreground block text-[10px] uppercase font-bold tracking-wide">Custo Total Acumulado</span>
                          <span className="text-foreground font-black text-base tabular-nums">{formatBRL(valTotalGeral)}</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          )}

          {formData.type !== "TRANSFER" && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-foreground uppercase tracking-wider">Categoria</label>
              <select
                required
                className="flex h-11 sm:h-12 w-full rounded-xl border border-border/80 bg-muted/60 text-foreground px-3.5 text-sm font-medium text-foreground focus:border-[#b300e4] focus:outline-none transition-colors cursor-pointer"
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              >
                <option value="" disabled>Selecione uma categoria</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </div>
          )}

          {initialData && Boolean((initialData as any).seriesId || /\(\d+\/\d+\)/.test(initialData.description)) && (
            <div className="p-4 rounded-2xl bg-[#b300e4]/10 border border-[#b300e4]/30 space-y-3 pt-4 my-4">
              <div className="flex items-center gap-2 text-[#b300e4] font-extrabold text-sm">
                <span>⚡ Esta transação faz parte de um parcelamento ou série</span>
              </div>
              <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                Você abriu a edição de um item em série. Escolha como as alterações que você fez acima devem ser salvas:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setUpdateAllInSeries(false)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    !updateAllInSeries 
                      ? "bg-[#b300e4] text-white border-[#b300e4] shadow-md shadow-[#b300e4]/25" 
                      : "bg-background/80 text-muted-foreground border-border/80 hover:bg-muted/50"
                  }`}
                >
                  <div className="font-extrabold text-xs flex items-center justify-between">
                    <span>✏️ Apenas esta parcela</span>
                    {!updateAllInSeries && <span className="size-2 rounded-full bg-white animate-ping" />}
                  </div>
                  <div className={`text-[11px] mt-1 leading-snug ${!updateAllInSeries ? "text-white/90 font-medium" : "text-muted-foreground"}`}>
                    Altera somente o registro do mês de <strong>{new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(new Date(initialData.date))}</strong>.
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setUpdateAllInSeries(true)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    updateAllInSeries 
                      ? "bg-[#b300e4] text-white border-[#b300e4] shadow-md shadow-[#b300e4]/25" 
                      : "bg-background/80 text-muted-foreground border-border/80 hover:bg-muted/50"
                  }`}
                >
                  <div className="font-extrabold text-xs flex items-center justify-between">
                    <span>🚀 Todas as parcelas da série</span>
                    {updateAllInSeries && <span className="size-2 rounded-full bg-white animate-ping" />}
                  </div>
                  <div className={`text-[11px] mt-1 leading-snug ${updateAllInSeries ? "text-white/90 font-medium" : "text-muted-foreground"}`}>
                    Atualiza o novo valor, conta e categoria em <strong>todas as parcelas pendentes</strong>. As antigas já pagas serão mantidas.
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      
      {/* Footer / Botões */}
      <div className={`mt-auto shrink-0 ${isModal ? "p-4 sm:p-5 border-t border-border/40 bg-card/95 backdrop-blur-md" : "p-6 border-t"}`}>
        <div className="flex items-center gap-3">
          {onCancel ? (
            <Button 
              variant="outline" 
              type="button" 
              onClick={onCancel} 
              className={isModal ? "flex-1 h-11 sm:h-12 rounded-xl text-sm font-bold border-border/80 hover:bg-muted" : ""}
            >
              Cancelar
            </Button>
          ) : (
            <Link href="/transactions" className="flex-1">
              <Button variant="outline" type="button" className="w-full h-11 sm:h-12 rounded-xl text-sm font-bold">
                Cancelar
              </Button>
            </Link>
          )}
          <Button 
            type="submit" 
            disabled={isPending} 
            className={`bg-[#b300e4] text-white hover:bg-[#b300e4]/90 shadow-md shadow-[#b300e4]/25 text-sm font-bold transition-all ${
              isModal ? "flex-1 h-11 sm:h-12 rounded-xl" : "h-11 sm:h-12 px-6 rounded-xl"
            }`}
          >
            {isPending ? "Salvando..." : (initialData ? "Salvar" : "Criar")}
          </Button>
        </div>
      </div>
    </form>
  );
}
