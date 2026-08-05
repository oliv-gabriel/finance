"use client";

import { useState } from "react";
import { upsertBudget } from "@/app/actions/budgets";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Wallet, Check, Pencil, X } from "lucide-react";

interface Category {
  id: string;
  name: string;
  color: string;
}

interface BudgetSummary {
  id?: string;
  categoryId: string;
  amount: number;
  spent: number;
}

export default function BudgetList({ 
  categories, 
  initialBudgets,
  currentMonth,
  currentYear
}: { 
  categories: Category[], 
  initialBudgets: BudgetSummary[],
  currentMonth: number,
  currentYear: number
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");

  async function handleSave(categoryId: string) {
    const amount = parseFloat(editValue);
    if (isNaN(amount)) return;

    const result = await upsertBudget({
      categoryId,
      amount,
      month: currentMonth,
      year: currentYear
    });

    if (result.success) {
      setEditingId(null);
      // In a real app we'd refresh the page or update local state
      window.location.reload();
    } else {
      alert(result.error);
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {categories.map((category) => {
        const budget = initialBudgets.find(b => b.categoryId === category.id);
        const isEditing = editingId === category.id;
        const percent = budget && budget.amount > 0 ? (budget.spent / budget.amount) * 100 : 0;
        const isOverBudget = percent > 100;

        return (
          <div key={category.id} className={`bg-card border ${isOverBudget ? "border-red-400 dark:border-red-800" : "border-border/70"} rounded-2xl p-6 shadow-xs flex flex-col justify-between hover:border-border transition-colors`}>
            <div className="flex flex-row items-center justify-between mb-4 pb-2 border-b border-border/50">
              <span className="text-base font-semibold text-foreground">
                {category.name}
              </span>
              <div 
                className="h-3 w-3 rounded-full shadow-2xs" 
                style={{ backgroundColor: category.color }}
              />
            </div>
            <div>
              <div className="flex justify-between items-end mb-4">
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase font-semibold tracking-wider">Gasto</p>
                  <p className="text-xl font-bold tracking-tight text-foreground mt-0.5">
                    {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(budget?.spent || 0)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] text-muted-foreground uppercase font-semibold tracking-wider">Orçado</p>
                  {isEditing ? (
                    <div className="flex items-center gap-1.5 mt-1">
                      <Input 
                        type="number" 
                        className="h-8 w-24 text-sm font-semibold text-right" 
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        autoFocus
                      />
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30" onClick={() => handleSave(category.id)}>
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30" onClick={() => setEditingId(null)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 mt-0.5 justify-end">
                      <p className="text-xl font-bold tracking-tight text-foreground">
                        {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(budget?.amount || 0)}
                      </p>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => {
                        setEditingId(category.id);
                        setEditValue(budget?.amount.toString() || "0");
                      }}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div className="w-full bg-muted/60 rounded-full h-2 mb-2 overflow-hidden border border-border/40">
                <div 
                  className={`h-full rounded-full transition-all duration-300 ${isOverBudget ? "bg-red-500" : "bg-emerald-600"}`}
                  style={{ width: `${Math.min(percent, 100)}%` }}
                />
              </div>
              <div className="flex justify-between items-center">
                <p className={`text-xs font-semibold ${isOverBudget ? "text-red-500" : "text-muted-foreground"}`}>
                  {percent.toFixed(1)}% utilizado
                </p>
                {budget && budget.amount > 0 && (
                  <p className="text-xs text-muted-foreground font-medium">
                    Restante: {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Math.max(0, budget.amount - budget.spent))}
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
