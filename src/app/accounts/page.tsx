import { getAccounts, deleteAccount } from "@/app/actions/accounts";
import { getDashboardData } from "@/app/actions/dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { CreditCard, Landmark, Trash2 } from "lucide-react";
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

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar summary={data.summary} />
      
      <div className="p-8 space-y-6 flex-1 overflow-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-3xl font-bold tracking-tight">Contas e Cartões</h1>
        </div>

        <AccountForm bankAccounts={bankAccounts as any} />

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Landmark className="h-5 w-5 text-blue-500" />
                Contas Bancárias
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {bankAccounts.map((account: any) => (
                  <li key={account.id} className="flex items-center justify-between p-2 border rounded-md">
                    <span className="font-medium">{account.name}</span>
                    <form action={async () => { "use server"; await handleDelete(account.id); }}>
                      <button type="submit" className="text-red-500 hover:text-red-700">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </form>
                  </li>
                ))}
                {bankAccounts.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma conta cadastrada.</p>}
              </ul>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-purple-500" />
                Cartões de Crédito
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {creditCards.map((card: any) => (
                  <li key={card.id} className="flex items-center justify-between p-2 border rounded-md">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{card.name}</span>
                      {card.bank && (
                        <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-muted-foreground px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Landmark className="h-3 w-3" />
                          {card.bank.name}
                        </span>
                      )}
                    </div>
                    <form action={async () => { "use server"; await handleDelete(card.id); }}>
                      <button type="submit" className="text-red-500 hover:text-red-700">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </form>
                  </li>
                ))}
                {creditCards.length === 0 && <p className="text-sm text-muted-foreground">Nenhum cartão cadastrado.</p>}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
