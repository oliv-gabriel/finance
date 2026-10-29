import { getTransactions } from "@/app/actions/transactions";
import { getDashboardData } from "@/app/actions/dashboard";
import { Button } from "@/components/ui/Button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { isAdmin } from "@/lib/auth-utils";
import Navbar from "@/components/Navbar";
import TransactionTable from "@/components/transactions/TransactionTable";

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string; startDate?: string; endDate?: string }>;
}) {
  const admin = await isAdmin();
  const params = await searchParams;
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const lastDay = new Date(currentYear, currentMonth, 0).getDate();
  const defaultStartDate = `${currentYear}-${pad(currentMonth)}-01`;
  const defaultEndDate = `${currentYear}-${pad(currentMonth)}-${pad(lastDay)}`;

  const startDate = params.startDate || defaultStartDate;
  const endDate = params.endDate || defaultEndDate;
  const startParts = startDate.split("-");
  const parsedYear = startParts.length === 3 ? parseInt(startParts[0]) : (params.year ? parseInt(params.year) : currentYear);
  const parsedMonth = startParts.length === 3 ? parseInt(startParts[1]) : (params.month ? parseInt(params.month) : currentMonth);

  const [data, transactions] = await Promise.all([
    getDashboardData(parsedMonth, parsedYear, startDate, endDate),
    getTransactions({ month: parsedMonth, year: parsedYear, startDate, endDate }),
  ]);

  return (
    <div className="flex flex-col min-h-screen bg-[#121212]">
      <Navbar summary={data.summary} isAdmin={admin} />
      
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
            <Link href={`?${(() => {
              const currentParams = new URLSearchParams();
              if (startDate && endDate) {
                currentParams.set("startDate", startDate);
                currentParams.set("endDate", endDate);
              } else {
                if (parsedMonth) currentParams.set("month", parsedMonth.toString());
                if (parsedYear) currentParams.set("year", parsedYear.toString());
              }
              currentParams.set("newTransaction", "true");
              return currentParams.toString();
            })()}`}>
              <Button className="rounded-full font-bold bg-[#b300e4] hover:bg-[#b300e4]/90 shadow-md shadow-[#b300e4]/20 transition-all text-white cursor-pointer px-4">
                <Plus className="mr-1.5 h-4 w-4 stroke-[3]" />
                <span>Nova Transação</span>
              </Button>
            </Link>
          </div>
        </div>

        <TransactionTable
          transactions={transactions as any}
          summary={data.summary}
          accounts={data.accounts}
          creditCards={data.creditCards}
          categories={data.categoryDistribution}
        />
      </div>
    </div>
  );
}
