"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createTransaction, updateTransaction } from "@/app/actions/transactions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/Card";
import { Save, ArrowUpCircle, ArrowDownCircle, ArrowRightLeft, Calendar as CalendarIcon } from "lucide-react";
import Link from "next/link";
import { format, parse } from "date-fns";
import { ptBR } from "date-fns/locale";

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
    categoryId: string;
    paid: boolean;
    accountId?: string | null;
  };
  initialEditMode?: "single" | "series";
}

export default function TransactionForm({ categories, accounts, initialData, initialEditMode }: TransactionFormProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [updateAllInSeries, setUpdateAllInSeries] = useState(initialEditMode === "series");
  const hiddenDateInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    description: initialData?.description || "",
    amount: initialData 
      ? new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2 }).format(initialData.amount)
      : "0,00",
    date: format(initialData?.date || new Date(), "dd/MM/yyyy"),
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
      setFormData({ ...formData, date: format(parsedDate, "dd/MM/yyyy") });
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsPending(true);
    
    try {
      const parsedDate = parse(formData.date, "dd/MM/yyyy", new Date());
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
        router.push("/transactions");
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
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>{initialData ? "Editar Transação" : "Nova Transação"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex bg-muted p-1 rounded-lg gap-1">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, type: "EXPENSE" })}
              className={`flex-1 flex items-center justify-center py-2 rounded-md text-sm font-medium transition-colors ${
                formData.type === "EXPENSE" 
                  ? "bg-white shadow text-red-600" 
                  : "text-muted-foreground hover:bg-white/50"
              }`}
            >
              <ArrowDownCircle className="mr-2 h-4 w-4" />
              Despesa
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, type: "INCOME" })}
              className={`flex-1 flex items-center justify-center py-2 rounded-md text-sm font-medium transition-colors ${
                formData.type === "INCOME" 
                  ? "bg-white shadow text-green-600" 
                  : "text-muted-foreground hover:bg-white/50"
              }`}
            >
              <ArrowUpCircle className="mr-2 h-4 w-4" />
              Receita
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, type: "TRANSFER", paid: true })}
              className={`flex-1 flex items-center justify-center py-2 rounded-md text-sm font-medium transition-colors ${
                formData.type === "TRANSFER" 
                  ? "bg-white shadow text-blue-600" 
                  : "text-muted-foreground hover:bg-white/50"
              }`}
            >
              <ArrowRightLeft className="mr-2 h-4 w-4" />
              Transferência
            </button>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Descrição</label>
            <Input
              required
              placeholder="Ex: Aluguel, Supermercado, Salário"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Valor (R$)</label>
              <Input
                required
                type="text"
                placeholder="0,00"
                value={formData.amount}
                onChange={handleAmountChange}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Data</label>
              <div className="relative group">
                <Input
                  required
                  type="text"
                  placeholder="DD/MM/AAAA"
                  value={formData.date}
                  onChange={handleDateChange}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => hiddenDateInputRef.current?.showPicker()}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-blue-600 transition-colors"
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
            <div className="flex items-center space-x-2 py-2">
              <input
                type="checkbox"
                id="paid"
                checked={formData.paid}
                onChange={(e) => setFormData({ ...formData, paid: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600 cursor-pointer"
              />
              <label htmlFor="paid" className="text-sm font-medium cursor-pointer">
                Esta transação já foi {formData.type === "EXPENSE" ? "paga" : "recebida"}
              </label>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">{formData.type === "TRANSFER" ? "Conta de Origem" : "Conta ou Cartão"}</label>
            <select
              required
              className="flex h-10 w-full rounded-md border border-slate-200 bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
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
              <label className="text-sm font-medium">Conta de Destino</label>
              <select
                required
                className="flex h-10 w-full rounded-md border border-slate-200 bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
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
            <div className="space-y-4 p-4 border rounded-md bg-slate-50 dark:bg-slate-900/50">
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
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
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
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
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
              <label className="text-sm font-medium">Categoria</label>
              <select
                required
                className="flex h-10 w-full rounded-md border border-slate-200 bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
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
                    Altera somente o registro do mês de <strong>{format(new Date(initialData.date), "MMMM", { locale: ptBR })}</strong>.
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
                    Atualiza o novo valor, conta e categoria em <strong>todos os meses</strong> desta série.
                  </div>
                </button>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-end space-x-2 border-t p-6">
          <Link href="/transactions">
            <Button variant="outline" type="button">Cancelar</Button>
          </Link>
          <Button type="submit" disabled={isPending}>
            <Save className="mr-2 h-4 w-4" />
            {isPending ? "Salvando..." : "Salvar Transação"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
