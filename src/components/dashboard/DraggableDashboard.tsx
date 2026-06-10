"use client";

import { useState, useEffect, useRef } from "react";
// @ts-ignore
import { Responsive, WidthProvider } from "react-grid-layout/legacy";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { ArrowUpCircle, ArrowDownCircle, Wallet, History, CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import Notepad from "./Notepad";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";

const ResponsiveGridLayout = WidthProvider(Responsive);

// Tipagem dos dados
interface DashboardData {
  summary: { 
    income: number; 
    expenses: number; 
    balance: number;
    paidIncome: number;
    pendingIncome: number;
    paidExpenses: number;
    pendingExpenses: number;
    effectiveBalance: number;
    liquidationDiff: number;
  };
  dailyExpenses: any[];
  categoryDistribution: any[];
  accounts: {
    id: string;
    name: string;
    balance: number;
    type: string;
  }[];
  creditCards: {
    id: string;
    name: string;
    faturaAtual: number;
    limiteDisponivel: number;
    closingDay: number | null;
    dueDay: number | null;
    status: string;
  }[];
}
interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: string;
  date: Date;
  paid: boolean;
  category: { name: string; color: string };
}

interface DraggableDashboardProps {
  data: DashboardData;
  recentTransactions: Transaction[];
}

const defaultLayout: any[] = [
  { i: "income", x: 0, y: 0, w: 3, h: 2 },
  { i: "expenses", x: 3, y: 0, w: 3, h: 2 },
  { i: "paid-block", x: 6, y: 0, w: 3, h: 2 },
  { i: "liquidation-block", x: 9, y: 0, w: 3, h: 2 },
  { i: "balance", x: 0, y: 2, w: 3, h: 2 },
  { i: "bar-chart", x: 3, y: 2, w: 4, h: 3 },
  { i: "accounts-balance", x: 7, y: 2, w: 5, h: 3 },
  { i: "cards-balance", x: 0, y: 5, w: 4, h: 3 },
  { i: "pie-chart", x: 4, y: 5, w: 4, h: 4 },
  { i: "transactions", x: 8, y: 5, w: 4, h: 4 },
  { i: "notepad", x: 0, y: 9, w: 12, h: 4 }
];

export default function DraggableDashboard({ data, recentTransactions }: DraggableDashboardProps) {
  const [mounted, setMounted] = useState(false);
  const [layouts, setLayouts] = useState<{ [key: string]: any[] }>({ lg: defaultLayout });
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    const savedLayout = localStorage.getItem("dashboard_layouts_v2");
    if (savedLayout) {
      try {
        setLayouts(JSON.parse(savedLayout));
      } catch (e) {
        console.error("Failed to parse layout");
      }
    }
  }, []);

  const handleLayoutChange = (currentLayout: any, allLayouts: any) => {
    setLayouts(allLayouts);
    localStorage.setItem("dashboard_layouts_v2", JSON.stringify(allLayouts));
  };

  const scrollCarousel = (direction: "left" | "right") => {
    if (carouselRef.current) {
      const scrollAmount = carouselRef.current.clientWidth;
      carouselRef.current.scrollBy({ left: direction === "left" ? -scrollAmount : scrollAmount, behavior: "smooth" });
    }
  };

  if (!mounted) return <div className="p-8">Carregando layout...</div>;

  return (
    <div className="space-y-4">
      <ResponsiveGridLayout
        className="layout"
        layouts={layouts}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={40}
        onLayoutChange={handleLayoutChange}
        draggableHandle=".drag-handle"
        margin={[8, 8]}
      >
        <div key="income">
          <Card className="h-full flex flex-col shadow-sm bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 border-slate-200 dark:border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-transparent drag-handle cursor-move rounded-t-lg">
              <CardTitle className="text-lg font-bold">Receitas</CardTitle>
              <ArrowUpCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent className="flex-1 flex items-center">
              <div className="text-2xl font-bold text-green-600">
                {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(data.summary.income)}
              </div>
            </CardContent>
          </Card>
        </div>

        <div key="expenses">
          <Card className="h-full flex flex-col shadow-sm bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 border-slate-200 dark:border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-transparent drag-handle cursor-move rounded-t-lg">
              <CardTitle className="text-lg font-bold">Despesas</CardTitle>
              <ArrowDownCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent className="flex-1 flex items-center">
              <div className="text-2xl font-bold text-red-600">
                {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(data.summary.expenses)}
              </div>
            </CardContent>
          </Card>
        </div>

        <div key="balance">
          <Card className="h-full flex flex-col shadow-sm bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 border-slate-200 dark:border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-transparent drag-handle cursor-move rounded-t-lg">
              <CardTitle className="text-lg font-bold">Saldo</CardTitle>
              <Wallet className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent className="flex-1 flex items-center">
              <div className={`text-2xl font-bold ${data.summary.balance >= 0 ? "text-blue-600" : "text-red-600"}`}>
                {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(data.summary.balance)}
              </div>
            </CardContent>
          </Card>
        </div>

        <div key="accounts-balance">
          <Card className="h-full flex flex-col shadow-sm bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 border-slate-200 dark:border-slate-800">
            <CardHeader className="bg-transparent py-3 drag-handle cursor-move rounded-t-lg">
              <CardTitle className="text-lg font-bold">Minha Conta</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-4">
              <div className="space-y-3">
                {data.accounts.map((acc) => (
                  <div key={acc.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                    <span className="text-sm font-medium">{acc.name}</span>
                    <span className={`text-sm font-bold ${acc.balance >= 0 ? "text-green-600" : "text-red-600"}`}>
                      (Saldo: {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(acc.balance)})
                    </span>
                  </div>
                ))}
                {data.accounts.length === 0 && (
                  <p className="text-center text-xs text-muted-foreground py-2">Nenhuma conta cadastrada.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div key="cards-balance">
          <Card className="h-full flex flex-col shadow-sm bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 border-slate-200 dark:border-slate-800">
            <CardHeader className="bg-transparent py-3 drag-handle cursor-move rounded-t-lg">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold">Meus Cartões</CardTitle>
                {data.creditCards.length > 1 && (
                  <div className="flex gap-1">
                    <button onClick={() => scrollCarousel("left")} className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button onClick={() => scrollCarousel("right")} className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0 relative">
              <div 
                ref={carouselRef}
                className="flex overflow-x-auto snap-x snap-mandatory h-full w-full [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
              >
                {data.creditCards.map((card) => (
                  <div key={card.id} className="min-w-full snap-center flex-shrink-0 flex flex-col justify-between p-5">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-bold truncate max-w-[120px]">{card.name}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold whitespace-nowrap ${card.status === "Aberto" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {card.status} (Dia {card.closingDay})
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs mt-auto">
                      <div className="flex flex-col">
                        <span className="text-muted-foreground">Fatura atual:</span>
                        <span className="font-bold text-red-600">{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(card.faturaAtual)}</span>
                      </div>
                      <div className="flex flex-col text-right">
                        <span className="text-muted-foreground">Limite disp.:</span>
                        <span className="font-bold text-blue-600">{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(card.limiteDisponivel)}</span>
                      </div>
                    </div>
                  </div>
                ))}
                {data.creditCards.length === 0 && (
                  <div className="min-w-full flex items-center justify-center">
                    <p className="text-center text-xs text-muted-foreground py-2">Nenhum cartão cadastrado.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div key="paid-block">
          <Card className="h-full flex flex-col shadow-sm bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 border-slate-200 dark:border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-transparent drag-handle cursor-move rounded-t-lg">
              <CardTitle className="text-lg font-bold">Pago</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent className="flex-1 flex items-center">
              <div className="text-2xl font-bold text-blue-600">
                {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(data.summary.paidExpenses)}
              </div>
            </CardContent>
          </Card>
        </div>

        <div key="liquidation-block">
          <Card className="h-full flex flex-col shadow-sm bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 border-slate-200 dark:border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-transparent drag-handle cursor-move rounded-t-lg">
              <CardTitle className="text-lg font-bold">Liquidação</CardTitle>
              <ArrowDownCircle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent className="flex-1 flex items-center">
              <div className={`text-2xl font-bold ${data.summary.liquidationDiff >= 0 ? "text-green-600" : "text-red-600"}`}>
                {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(data.summary.liquidationDiff)}
              </div>
            </CardContent>
          </Card>
        </div>

        <div key="bar-chart">
          <Card className="h-full flex flex-col shadow-sm bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 border-slate-200 dark:border-slate-800">
            <CardHeader className="bg-transparent py-3 drag-handle cursor-move rounded-t-lg">
              <CardTitle className="text-lg font-bold">Gastos Diários</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-2 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.dailyExpenses}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} tickFormatter={(value) => `R$${value}`} />
                  <RechartsTooltip 
                    formatter={(value: any) => [new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value), "Gasto"]}
                    labelFormatter={(label) => `Dia ${label}`}
                  />
                  <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div key="pie-chart">
          <Card className="h-full flex flex-col shadow-sm bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 border-slate-200 dark:border-slate-800">
            <CardHeader className="bg-transparent py-3 drag-handle cursor-move rounded-t-lg">
              <CardTitle className="text-lg font-bold">Distribuição por Categoria</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-2 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.categoryDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {data.categoryDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    formatter={(value: any) => [new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value), "Total"]}
                  />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div key="transactions">
          <Card className="h-full flex flex-col shadow-sm bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 border-slate-200 dark:border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between bg-transparent py-3 drag-handle cursor-move rounded-t-lg">
              <CardTitle className="text-lg font-bold">Transações Recentes</CardTitle>
              <Link href="/transactions" className="text-sm text-blue-600 hover:underline flex items-center">
                <History className="mr-1 h-4 w-4" />
                Ver todas
              </Link>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-4">
              <div className="space-y-4">
                {recentTransactions.map((t) => (
                  <div key={t.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                    <div className="flex items-center">
                      <div 
                        className="mr-3 h-2 w-2 rounded-full flex-shrink-0" 
                        style={{ backgroundColor: t.category.color }}
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{t.description}</p>
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-muted-foreground">{t.category.name}</p>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${t.paid ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                            {t.paid ? "Pago" : "Pendente"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <p className={`text-sm font-bold ${t.type === "INCOME" ? "text-green-600" : "text-red-600"}`}>
                        {t.type === "INCOME" ? "+" : "-"} 
                        {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(t.amount)}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {format(new Date(t.date), "dd/MM")}
                      </p>
                    </div>
                  </div>
                ))}
                {recentTransactions.length === 0 && (
                  <p className="text-center text-sm text-muted-foreground py-4">Nenhuma transação recente.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div key="notepad">
          <Notepad />
        </div>
      </ResponsiveGridLayout>
    </div>
  );
}
