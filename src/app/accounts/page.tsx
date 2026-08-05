import { getAccounts, deleteAccount, toggleAccountIncludeInTotal } from "@/app/actions/accounts";
import { getDashboardData } from "@/app/actions/dashboard";
import { CreditCard, Landmark, Trash2, Eye, EyeOff } from "lucide-react";
import { revalidatePath } from "next/cache";
import AccountForm from "@/components/accounts/AccountForm";
import Navbar from "@/components/Navbar";

export default async function AccountsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>;
}) {
  const params = await searchParams;
  const now = new Date();
  const month = params.month ? parseInt(params.month) : now.getMonth() + 1;
  const year = params.year ? parseInt(params.year) : now.getFullYear();

  const accounts = await getAccounts();
  const data = await getDashboardData(month, year);
  
  const bankAccounts = accounts.filter(a => a.type === "CONTA");
  const creditCards = accounts.filter(a => a.type === "CARTAO");

  async function handleDelete(id: string) {
    "use server";
    await deleteAccount(id);
    revalidatePath("/accounts");
  }

  async function handleToggleInclude(id: string, currentVal: boolean) {
    "use server";
    await toggleAccountIncludeInTotal(id, !currentVal);
    revalidatePath("/accounts");
    revalidatePath("/");
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#121212]">
      <Navbar summary={data.summary} />
      
      <div className="p-6 md:p-8 max-w-7xl mx-auto w-full space-y-8 flex-1 overflow-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Contas e Cartões</h1>
            <p className="text-sm text-muted-foreground mt-1">Gerencie suas contas e controle se os saldos entram no somatório geral do seu dashboard.</p>
          </div>
        </div>

        <AccountForm bankAccounts={bankAccounts as any} />

        <div className="grid gap-6 md:grid-cols-2">
          <div className="bg-card border border-border/70 rounded-2xl p-6 shadow-xs flex flex-col">
            <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-border/50">
              <div className="size-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Landmark className="h-4 w-4" />
              </div>
              <h2 className="text-base font-semibold tracking-tight text-foreground">Contas Bancárias</h2>
            </div>
            <ul className="space-y-3 flex-1">
                {bankAccounts.map((account: any) => (
                  <li key={account.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                    <div className="flex items-center flex-wrap gap-2">
                      <span className="font-medium text-base">{account.name}</span>
                    </div>
                    <div className="flex items-center gap-3 self-end sm:self-auto">
                      <form action={async () => { "use server"; await handleToggleInclude(account.id, account.includeInTotal !== false); }}>
                        <button 
                          type="submit" 
                          className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-lg border transition-all duration-200 cursor-pointer shadow-2xs ${
                            account.includeInTotal === false 
                              ? "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 hover:bg-red-500/20 hover:border-red-500/30" 
                              : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20 hover:border-emerald-500/30"
                          }`}
                        >
                          {account.includeInTotal === false ? (
                            <>
                              <EyeOff className="h-3.5 w-3.5" />
                              <span>Não incluir no saldo atual</span>
                            </>
                          ) : (
                            <>
                              <Eye className="h-3.5 w-3.5" />
                              <span>Incluir no saldo atual</span>
                            </>
                          )}
                        </button>
                      </form>
                      <form action={async () => { "use server"; await handleDelete(account.id); }}>
                        <button type="submit" title="Excluir conta" className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-md transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </form>
                    </div>
                  </li>
                ))}
                {bankAccounts.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">Nenhuma conta cadastrada.</p>}
              </ul>
            </div>

            <div className="bg-card border border-border/70 rounded-2xl p-6 shadow-xs flex flex-col">
              <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-border/50">
                <div className="size-8 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <CreditCard className="h-4 w-4" />
                </div>
                <h2 className="text-base font-semibold tracking-tight text-foreground">Cartões de Crédito</h2>
              </div>
              <ul className="space-y-3 flex-1">
                {creditCards.map((card: any) => (
                  <li key={card.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                    <div className="flex items-center flex-wrap gap-2">
                      <span className="font-medium text-base">{card.name}</span>
                      {card.bank && (
                        <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-muted-foreground px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Landmark className="h-3 w-3" />
                          {card.bank.name}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 self-end sm:self-auto">
                      <form action={async () => { "use server"; await handleToggleInclude(card.id, card.includeInTotal !== false); }}>
                        <button 
                          type="submit" 
                          className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-lg border transition-all duration-200 cursor-pointer shadow-2xs ${
                            card.includeInTotal === false 
                              ? "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 hover:bg-red-500/20 hover:border-red-500/30" 
                              : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20 hover:border-emerald-500/30"
                          }`}
                        >
                          {card.includeInTotal === false ? (
                            <>
                              <EyeOff className="h-3.5 w-3.5" />
                              <span>Não incluir no saldo atual</span>
                            </>
                          ) : (
                            <>
                              <Eye className="h-3.5 w-3.5" />
                              <span>Incluir no saldo atual</span>
                            </>
                          )}
                        </button>
                      </form>
                      <form action={async () => { "use server"; await handleDelete(card.id); }}>
                        <button type="submit" title="Excluir cartão" className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-md transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </form>
                    </div>
                  </li>
                ))}
                {creditCards.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">Nenhum cartão cadastrado.</p>}
              </ul>
            </div>
        </div>
      </div>
    </div>
  );
}
