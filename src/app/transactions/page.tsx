import { getTransactions } from "@/app/actions/transactions";
import { getDashboardData } from "@/app/actions/dashboard";
import { Button } from "@/components/ui/Button";
import { Plus } from "lucide-react";
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
    <div className="flex flex-col min-h-screen">
      <Navbar summary={data.summary} />
      
      <div className="p-8 space-y-6 flex-1 overflow-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Transações</h1>
            <p className="text-muted-foreground">
              Acompanhe e gerencie todas as suas entradas e saídas.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <DeleteAllTransactionsButton />
            <Link href="/transactions/new">
              <Button className="rounded-full">
                <Plus className="mr-2 h-4 w-4" />
                Nova Transação
              </Button>
            </Link>
          </div>
        </div>

        <TransactionTable transactions={transactions as any} />
      </div>
    </div>
  );
}
