"use client";

import { useState } from "react";
import { createAccount } from "@/app/actions/accounts";
import { Landmark, CreditCard, Plus, X, Loader2, Info } from "lucide-react";
import { useRouter } from "next/navigation";

interface Account {
  id: string;
  name: string;
  type: string;
}

interface AccountFormProps {
  bankAccounts: Account[];
  isOpenDefault?: boolean;
}

export default function AccountForm({ bankAccounts, isOpenDefault = false }: AccountFormProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(isOpenDefault);
  const [type, setType] = useState<"CONTA" | "CARTAO">("CONTA");
  const [name, setName] = useState("");
  const [bankId, setBankId] = useState("");
  const [limit, setLimit] = useState("");
  const [closingDay, setClosingDay] = useState("");
  const [dueDay, setDueDay] = useState("");
  const [includeInTotal, setIncludeInTotal] = useState(true);
  const [isPending, setIsPending] = useState(false);

  const resetForm = () => {
    setName("");
    setBankId("");
    setLimit("");
    setClosingDay("");
    setDueDay("");
    setIncludeInTotal(true);
    setType("CONTA");
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    if (type === "CARTAO") {
      const cDay = parseInt(closingDay);
      const dDay = parseInt(dueDay);
      if (isNaN(cDay) || cDay < 1 || cDay > 31) {
        alert("O dia de fechamento deve ser um número entre 1 e 31.");
        return;
      }
      if (isNaN(dDay) || dDay < 1 || dDay > 31) {
        alert("O dia de vencimento deve ser um número entre 1 e 31.");
        return;
      }
    }

    setIsPending(true);

    const result = await createAccount({
      name: name.trim(),
      type,
      bankId: type === "CARTAO" && bankId ? bankId : undefined,
      limit: type === "CARTAO" && limit ? parseFloat(limit) : undefined,
      closingDay: type === "CARTAO" && closingDay ? parseInt(closingDay) : undefined,
      dueDay: type === "CARTAO" && dueDay ? parseInt(dueDay) : undefined,
      includeInTotal,
    });

    setIsPending(false);

    if (!result.success) {
      alert(result.error);
    } else {
      resetForm();
      setIsOpen(false);
      router.refresh();
    }
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-full py-3.5 px-4 rounded-2xl border border-dashed border-[#b300e4]/40 hover:border-[#b300e4] bg-card/50 hover:bg-[#b300e4]/5 text-sm font-semibold text-foreground font-medium hover:text-white flex items-center justify-center gap-2.5 transition-all duration-200 cursor-pointer group shadow-2xs"
      >
        <div className="w-7 h-7 rounded-xl bg-[#b300e4]/10 group-hover:bg-[#b300e4] text-[#b300e4] group-hover:text-white flex items-center justify-center transition-colors">
          <Plus className="h-4 w-4 stroke-[2.5]" />
        </div>
        <span>Cadastrar Nova Conta ou Cartão</span>
      </button>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-5 md:p-6 shadow-xl relative animate-in fade-in-50 zoom-in-95 duration-200">
      {/* Header do Form */}
      <div className="flex items-center justify-between pb-4 mb-5 border-b border-border/40">
        <div>
          <h2 className="text-base font-bold text-foreground tracking-tight">
            {type === "CONTA" ? "Cadastrar Nova Conta Bancária" : "Cadastrar Novo Cartão de Crédito"}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">Preencha os dados abaixo para cadastrar no sistema</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setIsOpen(false);
            resetForm();
          }}
          className="text-muted-foreground hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
          title="Fechar formulário"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Seletor de Tipo (Pills / Abas) */}
        <div>
          <label className="text-xs font-semibold text-foreground font-medium mb-1.5 block">Tipo de Registro</label>
          <div className="grid grid-cols-2 gap-2 p-1 bg-muted/50 border border-border rounded-xl">
            <button
              type="button"
              onClick={() => setType("CONTA")}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs md:text-sm font-semibold transition-all cursor-pointer ${
                type === "CONTA"
                  ? "bg-[#b300e4] text-white shadow-md shadow-[#b300e4]/30"
                  : "text-muted-foreground hover:text-white"
              }`}
            >
              <Landmark className="w-4 h-4" />
              Conta Bancária
            </button>
            <button
              type="button"
              onClick={() => setType("CARTAO")}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs md:text-sm font-semibold transition-all cursor-pointer ${
                type === "CARTAO"
                  ? "bg-[#b300e4] text-white shadow-md shadow-[#b300e4]/30"
                  : "text-muted-foreground hover:text-white"
              }`}
            >
              <CreditCard className="w-4 h-4" />
              Cartão de Crédito
            </button>
          </div>
        </div>

        {/* Nome da Conta ou Cartão */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground font-medium">
            {type === "CONTA" ? "Nome da Conta ou Banco" : "Nome do Cartão"}
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={type === "CONTA" ? "Ex: Nubank, Itaú, 99Pay, Inter..." : "Ex: Nubank Ultravioleta, BB Elo, C6..."}
            className="w-full h-11 px-3.5 rounded-xl bg-muted/50 border border-border text-white placeholder:text-muted-foreground/80 text-sm focus:outline-none focus:border-[#b300e4] focus:ring-1 focus:ring-[#b300e4] transition-all"
          />
        </div>

        {/* Campos específicos para Cartão de Crédito */}
        {type === "CARTAO" && (
          <div className="space-y-3 pt-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground font-medium">Vincular a uma Conta</label>
                <select
                  value={bankId}
                  onChange={(e) => setBankId(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl bg-muted/50 border border-border text-white text-sm focus:outline-none focus:border-[#b300e4] focus:ring-1 focus:ring-[#b300e4] transition-all cursor-pointer"
                >
                  <option value="" className="bg-muted/50 text-muted-foreground">Nenhuma (Avulso)</option>
                  {bankAccounts.map((b) => (
                    <option key={b.id} value={b.id} className="bg-muted/50 text-white">
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground font-medium">Limite Total (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={limit}
                  onChange={(e) => setLimit(e.target.value)}
                  placeholder="0,00"
                  className="w-full h-11 px-3.5 rounded-xl bg-muted/50 border border-border text-white placeholder:text-muted-foreground/80 text-sm focus:outline-none focus:border-[#b300e4] focus:ring-1 focus:ring-[#b300e4] transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground font-medium">
                    Dia Fechamento (Corte) <span className="text-red-400">*</span>
                  </label>
                  <span className="text-[10px] text-muted-foreground/80">Ex: 10</span>
                </div>
                <input
                  type="number"
                  min="1"
                  max="31"
                  required={type === "CARTAO"}
                  value={closingDay}
                  onChange={(e) => setClosingDay(e.target.value)}
                  placeholder="Ex: 10"
                  className="w-full h-11 px-3.5 rounded-xl bg-muted/50 border border-border text-white placeholder:text-muted-foreground/80 text-sm focus:outline-none focus:border-[#b300e4] focus:ring-1 focus:ring-[#b300e4] transition-all"
                />
                <p className="text-[11px] text-muted-foreground">
                  Melhor dia de compra. Até este dia as compras entram na fatura deste mês.
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground font-medium">
                    Dia Vencimento (Pagamento) <span className="text-red-400">*</span>
                  </label>
                  <span className="text-[10px] text-muted-foreground/80">Ex: 20</span>
                </div>
                <input
                  type="number"
                  min="1"
                  max="31"
                  required={type === "CARTAO"}
                  value={dueDay}
                  onChange={(e) => setDueDay(e.target.value)}
                  placeholder="Ex: 20"
                  className="w-full h-11 px-3.5 rounded-xl bg-muted/50 border border-border text-white placeholder:text-muted-foreground/80 text-sm focus:outline-none focus:border-[#b300e4] focus:ring-1 focus:ring-[#b300e4] transition-all"
                />
                <p className="text-[11px] text-muted-foreground">
                  Dia limite de pagamento do boleto da fatura.
                </p>
              </div>
            </div>

            {/* Dica visual de ciclo se ambos estiverem preenchidos */}
            {closingDay && dueDay && (
              <div className="p-3 rounded-xl bg-white/5 border border-border flex items-center gap-2.5 text-xs text-foreground font-medium">
                <Info className="w-4 h-4 text-[#b300e4] shrink-0" />
                <span>
                  Resumo: Compras até dia <strong>{closingDay}</strong> entram na fatura com vencimento dia <strong>{dueDay}</strong>.
                </span>
              </div>
            )}
          </div>
        )}

        {/* Toggle Switch "Somar no saldo geral" */}
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-muted/50/70 border border-border/80">
          <div className="flex flex-col pr-3">
            <span className="text-sm font-semibold text-white">Somar no saldo geral</span>
            <span className="text-xs text-muted-foreground">
              {type === "CONTA"
                ? "Contabiliza o saldo desta conta no valor total do dashboard"
                : "Contabiliza as faturas deste cartão nas despesas do dashboard"}
            </span>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={includeInTotal}
            onClick={() => setIncludeInTotal(!includeInTotal)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              includeInTotal ? "bg-[#b300e4]" : "bg-zinc-700"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                includeInTotal ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {/* Botões de Ação */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              resetForm();
            }}
            className="px-4 py-2.5 rounded-xl text-xs md:text-sm font-semibold text-muted-foreground hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs md:text-sm font-bold bg-[#b300e4] hover:bg-[#b300e4]/90 text-white shadow-md shadow-[#b300e4]/25 transition-all duration-200 cursor-pointer disabled:opacity-50"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Cadastrando...</span>
              </>
            ) : (
              <span>Cadastrar {type === "CONTA" ? "Conta" : "Cartão"}</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
