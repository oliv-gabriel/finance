import { getDashboardData } from "@/app/actions/dashboard";
import { getTransactions } from "@/app/actions/transactions";
import Navbar from "@/components/Navbar";
import { History, CheckCircle2, Wallet, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import Link from "next/link";
import Notepad from "@/components/dashboard/Notepad";
import { ExpensesBarChart, CategoriesPieChart } from "@/components/dashboard/DashboardCharts";
import FinancialSummary from "@/components/dashboard/FinancialSummary";
import RecentTransactions from "@/components/dashboard/RecentTransactions";

export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>;
}) {
  const params = await searchParams;
  const now = new Date();
  const month = params.month ? parseInt(params.month) : now.getMonth() + 1;
  const year = params.year ? parseInt(params.year) : now.getFullYear();

  const data = await getDashboardData(month, year);
  const recentTransactions = await getTransactions({ limit: 5, month, year });

  return (
    <div className="flex flex-col min-h-screen bg-[#121212]">
      <Navbar summary={data.summary} />
      
      <div className="p-6 md:p-8 max-w-7xl mx-auto w-full space-y-8 flex-1 overflow-auto">
        {/* Row de Métricas Centrais */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-card border border-border/70 rounded-2xl p-5 shadow-xs hover:border-border transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Saldo Geral</span>
              <div className="size-8 rounded-full bg-[#b300e4]/15 text-[#b300e4] flex items-center justify-center shadow-2xs">
                <Wallet className="h-4 w-4" />
              </div>
            </div>
            <div className={`text-2xl lg:text-3xl font-bold tracking-tight mt-4 ${data.summary.balance >= 0 ? "text-foreground" : "text-red-500"}`}>
              {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(data.summary.balance)}
            </div>
          </div>

          <div className="bg-card border border-border/70 rounded-2xl p-5 shadow-xs hover:border-border transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Receitas</span>
              <div className="size-8 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <ArrowUpCircle className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl lg:text-3xl font-bold tracking-tight text-foreground mt-4">
              {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(data.summary.income)}
            </div>
          </div>

          <div className="bg-card border border-border/70 rounded-2xl p-5 shadow-xs hover:border-border transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Despesas</span>
              <div className="size-8 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <ArrowDownCircle className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl lg:text-3xl font-bold tracking-tight text-foreground mt-4">
              {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(data.summary.expenses)}
            </div>
          </div>

          <div className="bg-card border border-border/70 rounded-2xl p-5 shadow-xs hover:border-border transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Pago</span>
              <div className="size-8 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl lg:text-3xl font-bold tracking-tight text-foreground mt-4">
              {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(data.summary.paidExpenses)}
            </div>
          </div>
        </div>

        {/* Novo Dashboard Summary */}
        <FinancialSummary 
          accounts={data.accounts}
          creditCards={data.creditCards}
          month={month}
          year={year}
        />

        {/* Row do Bloco de Notas */}
        <div className="w-full">
          <Notepad />
        </div>

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
