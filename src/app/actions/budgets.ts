"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getTransactionWhereForMonth } from "@/lib/billingCycles";
import { toCents, toNumber } from "@/lib/money";
import { getCurrentUserId } from "@/lib/auth-utils";

export async function getBudgets(month: number, year: number) {
  try {
    const userId = await getCurrentUserId();
    const budgets = await prisma.budget.findMany({
      where: { month, year, userId },
      include: {
        category: true,
      },
    });
    return budgets.map((budget) => ({ ...budget, amount: toNumber(budget.amount) }));
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
    const userId = await getCurrentUserId();
    const budget = await prisma.budget.upsert({
      where: {
        categoryId_month_year_userId: {
          categoryId: data.categoryId,
          month: data.month,
          year: data.year,
          userId,
        },
      },
      update: {
        amount: toCents(data.amount),
      },
      create: { ...data, userId, amount: toCents(data.amount) },
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
    const userId = await getCurrentUserId();
    // Get all budgets for the month
    const [budgets, allAccounts] = await Promise.all([
      prisma.budget.findMany({ where: { month, year, userId } }),
      prisma.account.findMany({ where: { userId } }),
    ]);

    // Get all expense transactions for the month respecting credit card closing days
    const whereClause = getTransactionWhereForMonth(month, year, allAccounts);

    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        type: "EXPENSE",
        ...whereClause,
      },
    });

    // Calculate totals per category
    const categoryExpenses = transactions.reduce((acc, curr) => {
      if (curr.categoryId) {
        acc[curr.categoryId] = (acc[curr.categoryId] || 0) + toNumber(curr.amount);
      }
      return acc;
    }, {} as Record<string, number>);

    return budgets.map((budget) => ({
      ...budget, amount: toNumber(budget.amount),
      spent: categoryExpenses[budget.categoryId] || 0,
    }));
  } catch (error) {
    console.error("Error getting budget summary:", error);
    return [];
  }
}
