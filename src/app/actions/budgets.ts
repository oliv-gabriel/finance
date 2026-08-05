"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getTransactionWhereForMonth } from "@/lib/billingCycles";

export async function getBudgets(month: number, year: number) {
  try {
    const budgets = await prisma.budget.findMany({
      where: { month, year },
      include: {
        category: true,
      },
    });
    return budgets;
  } catch (error) {
    console.error("Error fetching budgets:", error);
    return [];
  }
}

export async function upsertBudget(data: {
  categoryId: string;
  amount: number;
  month: number;
  year: number;
}) {
  try {
    const budget = await prisma.budget.upsert({
      where: {
        categoryId_month_year: {
          categoryId: data.categoryId,
          month: data.month,
          year: data.year,
        },
      },
      update: {
        amount: data.amount,
      },
      create: data,
    });
    revalidatePath("/budgets");
    revalidatePath("/");
    return { success: true, budget };
  } catch (error) {
    console.error("Error upserting budget:", error);
    return { success: false, error: "Falha ao definir orçamento" };
  }
}

export async function getBudgetSummary(month: number, year: number) {
  try {
    // Get all budgets for the month
    const budgets = await prisma.budget.findMany({
      where: { month, year },
    });

    // Get all expense transactions for the month respecting credit card closing days
    const allAccounts = await prisma.account.findMany();
    const whereClause = getTransactionWhereForMonth(month, year, allAccounts);

    const transactions = await prisma.transaction.findMany({
      where: {
        type: "EXPENSE",
        ...whereClause,
      },
    });

    // Calculate totals per category
    const categoryExpenses = transactions.reduce((acc, curr) => {
      acc[curr.categoryId] = (acc[curr.categoryId] || 0) + curr.amount;
      return acc;
    }, {} as Record<string, number>);

    return budgets.map((budget) => ({
      ...budget,
      spent: categoryExpenses[budget.categoryId] || 0,
    }));
  } catch (error) {
    console.error("Error getting budget summary:", error);
    return [];
  }
}
