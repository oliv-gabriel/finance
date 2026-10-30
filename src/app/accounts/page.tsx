import { getAccounts } from "@/app/actions/accounts";
import AccountForm from "@/components/accounts/AccountForm";
import AccountsList from "@/components/accounts/AccountsList";
import { isAdmin } from "@/lib/auth-utils";
import Navbar from "@/components/Navbar";

export default async function AccountsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>;
}) {
  const admin = await isAdmin();
  const params = await searchParams;
  const now = new Date();
  const month = params.month ? parseInt(params.month) : now.getMonth() + 1;
  const year = params.year ? parseInt(params.year) : now.getFullYear();

  const accounts = await getAccounts();

  const bankAccounts = accounts.filter((a) => a.type === "CONTA");
  const creditCards = accounts.filter((a) => a.type === "CARTAO");

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Navbar isAdmin={admin} />

      <div className="max-w-6xl mx-auto w-full px-4 py-5 md:px-8 md:py-8 space-y-6 flex-1 overflow-auto pb-36 sm:pb-16">
        {/* Cabeçalho da Página */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
              Contas e Cartões
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground mt-1">
              Gerencie suas contas, cartões e controle se os saldos entram no total do seu dashboard.
            </p>
          </div>
        </div>

        {/* Formulário de Cadastro (Colapsável / Expansível) */}
        <AccountForm 
          bankAccounts={bankAccounts as any} 
          isOpenDefault={accounts.length === 0}
        />

        {/* Lista de Contas Bancárias e Cartões de Crédito */}
        <AccountsList
          bankAccounts={bankAccounts as any}
          creditCards={creditCards as any}
          month={month}
          year={year}
        />
      </div>
    </div>
  );
}
