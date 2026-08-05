import { getCategories } from "@/app/actions/categories";
import { getBudgetSummary } from "@/app/actions/budgets";
import { getDashboardData } from "@/app/actions/dashboard";
import BudgetList from "@/components/budgets/BudgetList";
import Navbar from "@/components/Navbar";

export default async function BudgetsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>;
}) {
  const params = await searchParams;
  const now = new Date();
  const month = params.month ? parseInt(params.month) : now.getMonth() + 1;
  const year = params.year ? parseInt(params.year) : now.getFullYear();

  const categories = await getCategories();
  const budgetSummary = await getBudgetSummary(month, year);
  const data = await getDashboardData(month, year);

  return (
    <div className="flex flex-col min-h-screen bg-[#121212]">
      <Navbar summary={data.summary} />
      
      <div className="p-6 md:p-8 max-w-7xl mx-auto w-full space-y-8 flex-1 overflow-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Orçamentos</h1>
            <p className="text-muted-foreground">
              Defina limites de gastos por categoria e acompanhe seu progresso.
            </p>
          </div>
        </div>

        <BudgetList 
          categories={categories} 
          initialBudgets={budgetSummary}
          currentMonth={month}
          currentYear={year}
        />
      </div>
    </div>
  );
}
