import { getDashboardData } from "@/app/actions/dashboard";
import { getTransactions } from "@/app/actions/transactions";
import { isAdmin } from "@/lib/auth-utils";
import Navbar from "@/components/Navbar";
import { History, CheckCircle2, Wallet, ArrowUpCircle, ArrowDownCircle, Eye } from "lucide-react";
import Link from "next/link";
import { ExpensesBarChart, CategoriesPieChart } from "@/components/dashboard/DashboardCharts";
import FinancialSummary from "@/components/dashboard/FinancialSummary";
import RecentTransactions from "@/components/dashboard/RecentTransactions";
import DashboardMetrics from "@/components/dashboard/DashboardMetrics";

export default async function Dashboard({
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

  // Deriva o mês e ano ativos a partir da data de início (startDate) ou dos parâmetros
  const startParts = startDate.split("-");
  const parsedYear = startParts.length === 3 ? parseInt(startParts[0]) : (params.year ? parseInt(params.year) : currentYear);
  const parsedMonth = startParts.length === 3 ? parseInt(startParts[1]) : (params.month ? parseInt(params.month) : currentMonth);

  const [data, recentTransactions] = await Promise.all([
    getDashboardData(parsedMonth, parsedYear, startDate, endDate),
    getTransactions({ limit: 5, month: parsedMonth, year: parsedYear, startDate, endDate }),
  ]);

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Navbar summary={data.summary} isAdmin={admin} />
      
      <div className="p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6 md:space-y-8 flex-1 overflow-auto">
        {/* Row de Métricas Centrais */}
        <DashboardMetrics summary={data.summary} />

        {/* Novo Dashboard Summary */}
        <FinancialSummary 
          accounts={data.accounts}
          creditCards={data.creditCards}
          month={parsedMonth}
          year={parsedYear}
        />


        <div className="grid gap-6 lg:grid-cols-7">
          <div className="lg:col-span-4 bg-card border border-border/70 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
            <h2 className="text-base font-semibold tracking-tight text-foreground mb-4">Gastos Diários</h2>
            <div className="h-[300px] w-full">
              <ExpensesBarChart data={data.dailyExpenses} />
            </div>
          </div>
          <div className="lg:col-span-3 bg-card border border-border/70 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
            <h2 className="text-base font-semibold tracking-tight text-foreground mb-4">Distribuição por Categoria</h2>
            <div className="h-[300px] w-full">
              <CategoriesPieChart data={data.categoryDistribution} />
            </div>
          </div>
        </div>

        {/* Row das Transações Recentes */}
        <div className="bg-card border border-border/70 rounded-2xl p-6 shadow-xs">
          <div className="flex flex-row items-center justify-between mb-4">
            <h2 className="text-base font-semibold tracking-tight text-foreground">Transações Recentes</h2>
            <Link href="/transactions" className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 bg-muted/50 hover:bg-muted px-2.5 py-1.5 rounded-lg">
              <History className="h-3.5 w-3.5" /> Ver todas
            </Link>
          </div>
          <RecentTransactions transactions={recentTransactions as any} />
        </div>
      </div>
    </div>
  );
}
