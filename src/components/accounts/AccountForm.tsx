"use client";

import { useState } from "react";
import { createAccount } from "@/app/actions/accounts";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

interface Account {
  id: string;
  name: string;
  type: string;
}

export default function AccountForm({ bankAccounts }: { bankAccounts: Account[] }) {
  const [type, setType] = useState("CONTA");
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(formData: FormData) {
    setIsPending(true);
    const name = formData.get("name") as string;
    const type = formData.get("type") as string;
    const bankId = formData.get("bankId") as string;
    const limit = formData.get("limit") ? parseFloat(formData.get("limit") as string) : undefined;
    const closingDay = formData.get("closingDay") ? parseInt(formData.get("closingDay") as string) : undefined;
    const dueDay = formData.get("dueDay") ? parseInt(formData.get("dueDay") as string) : undefined;

    const result = await createAccount({ 
      name, 
      type, 
      bankId: type === "CARTAO" ? bankId : undefined,
      limit: type === "CARTAO" ? limit : undefined,
      closingDay: type === "CARTAO" ? closingDay : undefined,
      dueDay: type === "CARTAO" ? dueDay : undefined,
    });

    if (!result.success) {
      alert(result.error);
    }
    setIsPending(false);
    // The page will revalidate due to revalidatePath in the action
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cadastrar Nova Conta ou Cartão</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="flex flex-col md:flex-row items-end gap-4">
          <div className="flex-1 w-full space-y-2">
            <label className="text-sm font-medium">Nome</label>
            <Input name="name" required placeholder="Ex: Nubank, Itaú..." />
          </div>
          <div className="w-full md:w-48 space-y-2">
            <label className="text-sm font-medium">Tipo</label>
            <select 
              name="type" 
              required 
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="flex h-10 w-full rounded-md border border-slate-200 bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              <option value="CONTA">Conta Bancária</option>
              <option value="CARTAO">Cartão de Crédito</option>
            </select>
          </div>

          {type === "CARTAO" && (
            <>
              <div className="w-full md:w-48 space-y-2">
                <label className="text-sm font-medium">Vincular ao Banco</label>
                <select 
                  name="bankId" 
                  required 
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                >
                  <option value="" disabled selected>Selecione o banco</option>
                  {bankAccounts.map(bank => (
                    <option key={bank.id} value={bank.id}>{bank.name}</option>
                  ))}
                </select>
              </div>
              <div className="w-full md:w-32 space-y-2">
                <label className="text-sm font-medium">Limite Total</label>
                <Input name="limit" type="number" step="0.01" required placeholder="0,00" />
              </div>
              <div className="w-full md:w-28 space-y-2">
                <label className="text-sm font-medium">Dia Fechamento</label>
                <Input name="closingDay" type="number" min="1" max="31" required placeholder="Ex: 5" />
              </div>
              <div className="w-full md:w-28 space-y-2">
                <label className="text-sm font-medium">Dia Vencimento</label>
                <Input name="dueDay" type="number" min="1" max="31" required placeholder="Ex: 12" />
              </div>
            </>
          )}

          <div className="flex-shrink-0">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Cadastrando..." : "Cadastrar"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
