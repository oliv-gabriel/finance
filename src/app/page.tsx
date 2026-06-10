import { getDashboardData } from "@/app/actions/dashboard";
import { getTransactions } from "@/app/actions/transactions";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { History, CheckCircle2, Wallet, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
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
    <div className="flex flex-col min-h-screen">
      <Navbar summary={data.summary} />
      
      <div className="p-8 space-y-8 flex-1 overflow-auto">
        {/* Row de Métricas Centrais */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 border-blue-200 dark:border-blue-800 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-bold text-blue-800 dark:text-blue-300">Saldo Geral</CardTitle>
              <Wallet className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-black ${data.summary.balance >= 0 ? "text-blue-700" : "text-red-700"}`}>
                {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(data.summary.balance)}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 border-green-200 dark:border-green-800 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-bold text-green-800 dark:text-green-300">Receitas</CardTitle>
              <ArrowUpCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-green-700">
                {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(data.summary.income)}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/20 dark:to-red-900/20 border-red-200 dark:border-red-800 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-bold text-red-800 dark:text-red-300">Despesas</CardTitle>
              <ArrowDownCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-red-700">
                {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(data.summary.expenses)}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-950/20 dark:to-indigo-900/20 border-indigo-200 dark:border-indigo-800 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-bold text-indigo-800 dark:text-indigo-300">Total Pago</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-indigo-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-indigo-700">
                {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(data.summary.paidExpenses)}
              </div>
            </CardContent>
          </Card>
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
          <Card className="lg:col-span-4 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Gastos Diários</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ExpensesBarChart data={data.dailyExpenses} />
            </CardContent>
          </Card>
          <Card className="lg:col-span-3 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Distribuição por Categoria</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <CategoriesPieChart data={data.categoryDistribution} />
            </CardContent>
          </Card>
        </div>

        {/* Row das Transações Recentes */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-bold">Transações Recentes</CardTitle>
            <Link href="/transactions" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
              <History className="h-4 w-4" /> Ver todas
            </Link>
          </CardHeader>
          <CardContent>
            <RecentTransactions transactions={recentTransactions as any} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
