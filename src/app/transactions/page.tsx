import { getTransactions } from "@/app/actions/transactions";
import { getDashboardData } from "@/app/actions/dashboard";
import { Button } from "@/components/ui/Button";
import { Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import DeleteAllTransactionsButton from "@/components/transactions/DeleteAllTransactionsButton";
import Navbar from "@/components/Navbar";
import TransactionTable from "@/components/transactions/TransactionTable";

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>;
}) {
  const params = await searchParams;
  const now = new Date();
  const month = params.month ? parseInt(params.month) : now.getMonth() + 1;
  const year = params.year ? parseInt(params.year) : now.getFullYear();

  const data = await getDashboardData(month, year);
  const transactions = await getTransactions({ month, year });

  return (
    <div className="flex flex-col min-h-screen bg-[#121212]">
      <Navbar summary={data.summary} />
      
      <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6 flex-1 pb-36 md:pb-10">
        {/* Cabeçalho Desktop vs Mobile */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">Transações</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 hidden sm:block">
              Acompanhe e gerencie todas as suas entradas e saídas do mês.
            </p>
          </div>
          <div className="flex items-center gap-3 self-end sm:self-auto">
            <DeleteAllTransactionsButton />
            <Link href="/transactions/new">
              <Button className="rounded-full font-bold bg-[#b300e4] hover:bg-[#b300e4]/90 shadow-md shadow-[#b300e4]/20 transition-all text-white cursor-pointer px-4">
                <Plus className="mr-1.5 h-4 w-4 stroke-[3]" />
                <span>Nova Transação</span>
              </Button>
            </Link>
          </div>
        </div>

        <TransactionTable transactions={transactions as any} summary={data.summary} />
      </div>
    </div>
  );
}
