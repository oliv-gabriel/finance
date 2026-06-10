"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createTransaction, updateTransaction } from "@/app/actions/transactions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/Card";
import { Save, ArrowUpCircle, ArrowDownCircle, Calendar as CalendarIcon } from "lucide-react";
import Link from "next/link";
import { format, parse } from "date-fns";

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
}

export default function TransactionForm({ categories, accounts, initialData }: TransactionFormProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
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
    entryType: "unico",
    recurrenceFreq: "Mensal",
    quantity: 1,
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
        ? await updateTransaction(initialData.id, payload)
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

          <div className="space-y-2">
            <label className="text-sm font-medium">Conta ou Cartão</label>
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

          {showRecurrence && (
            <div className="space-y-4 p-4 border rounded-md bg-slate-50 dark:bg-slate-900/50">
              <div className="space-y-2">
                <label className="text-sm font-medium">Lançamento</label>
                <div className="flex bg-muted p-1 rounded-lg gap-1">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, entryType: "unico", quantity: 1 })}
                    className={`flex-1 flex items-center justify-center py-1.5 rounded-md text-xs font-medium transition-colors ${
                      formData.entryType === "unico" ? "bg-white shadow text-blue-600" : "text-muted-foreground hover:bg-white/50"
                    }`}
                  >
                    Único
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, entryType: "recorrente", quantity: 2 })}
                    className={`flex-1 flex items-center justify-center py-1.5 rounded-md text-xs font-medium transition-colors ${
                      formData.entryType === "recorrente" ? "bg-white shadow text-blue-600" : "text-muted-foreground hover:bg-white/50"
                    }`}
                  >
                    Recorrente
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, entryType: "parcelado", quantity: 2 })}
                    className={`flex-1 flex items-center justify-center py-1.5 rounded-md text-xs font-medium transition-colors ${
                      formData.entryType === "parcelado" ? "bg-white shadow text-blue-600" : "text-muted-foreground hover:bg-white/50"
                    }`}
                  >
                    Parcelado
                  </button>
                </div>
              </div>

              {formData.entryType !== "unico" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      {formData.entryType === "recorrente" ? "Recorrência" : "Recorrência das parcelas"}
                    </label>
                    <select
                      className="flex h-9 w-full rounded-md border border-slate-200 bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                      value={formData.recurrenceFreq}
                      onChange={(e) => setFormData({ ...formData, recurrenceFreq: e.target.value })}
                    >
                      <option value="Mensal">Mensal</option>
                      <option value="Quinzenal">Quinzenal</option>
                      <option value="Bimestral">Bimestral</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      {formData.entryType === "recorrente" ? "Quantidade" : "Quantas vezes"}
                    </label>
                    <Input
                      type="number"
                      min={formData.entryType === "parcelado" ? 2 : 1}
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                      className="h-9"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

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
