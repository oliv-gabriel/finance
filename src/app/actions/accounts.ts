"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getAccountBillingCycle } from "@/lib/billingCycles";

export async function getAccounts() {
  try {
    const accounts = await prisma.account.findMany({
      include: {
        bank: true,
      },
      orderBy: { name: "asc" },
    });
    return accounts;
  } catch (error) {
    console.error("Error fetching accounts:", error);
    return [];
  }
}

export async function createAccount(data: { 
  name: string; 
  type: string; 
  bankId?: string;
  limit?: number;
  closingDay?: number;
  dueDay?: number;
  includeInTotal?: boolean;
}) {
  try {
    const { bankId, ...rest } = data;
    const account = await prisma.account.create({
      data: {
        ...rest,
        includeInTotal: rest.includeInTotal !== undefined ? rest.includeInTotal : true,
        bankId: bankId && bankId.trim() !== "" ? bankId : null,
      },
    });
    revalidatePath("/accounts");
    revalidatePath("/transactions/new");
    revalidatePath("/");
    return { success: true, account };
  } catch (error) {
    console.error("Error creating account:", error);
    // Return a more descriptive error if possible
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    return { success: false, error: `Falha ao criar conta: ${errorMessage}` };
  }
}

export async function deleteAccount(id: string) {
  try {
    await prisma.account.delete({
      where: { id },
    });
    revalidatePath("/accounts");
    revalidatePath("/transactions/new");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error deleting account:", error);
    return { success: false, error: "Falha ao excluir conta/cartão" };
  }
}

export async function toggleAccountIncludeInTotal(id: string, includeInTotal: boolean) {
  try {
    await prisma.account.update({
      where: { id },
      data: { includeInTotal },
    });
    revalidatePath("/accounts");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error toggling account includeInTotal:", error);
    return { success: false, error: "Falha ao alterar inclusão no saldo geral" };
  }
}

export async function getCardInvoiceDetails(cardId: string, month: number, year: number) {
  try {
    const card = await prisma.account.findUnique({
      where: { id: cardId },
      include: { bank: true },
    });
    if (!card) return null;

    const { startDate, endDate } = getAccountBillingCycle(card, month, year);

    const transactions = await prisma.transaction.findMany({
      where: {
        accountId: cardId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        category: true,
      },
      orderBy: { date: "desc" },
    });

    const expenses = transactions.filter((t) => t.type === "EXPENSE");
    const totalSpent = expenses.reduce((sum, t) => sum + t.amount, 0);
    const totalPaid = expenses.filter((t) => t.paid).reduce((sum, t) => sum + t.amount, 0);
    const limit = card.limit || 0;
    
    // Calcular a porcentagem utilizada do limite
    const percentageUsed = limit > 0 ? Math.min(100, Math.round((totalSpent / limit) * 100)) : 0;
    const isPaid = expenses.length > 0 && expenses.every(t => t.paid);

    return {
      card: {
        id: card.id,
        name: card.name,
        limit,
        closingDay: card.closingDay || null,
        dueDay: card.dueDay || null,
        bankName: card.bank?.name || card.name,
      },
      invoice: {
        totalSpent,
        totalPaid,
        percentageUsed,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        isPaid,
        transactions: transactions.map(t => ({
          id: t.id,
          description: t.description,
          amount: t.amount,
          date: t.date.toISOString(),
          type: t.type,
          paid: t.paid,
          categoryName: t.category?.name || "Geral",
          categoryColor: t.category?.color || "#b300e4",
        })),
      },
    };
  } catch (error) {
    console.error("Error fetching card invoice details:", error);
    return null;
  }
}
