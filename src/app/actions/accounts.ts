"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getAccountBillingCycle } from "@/lib/billingCycles";
import { toNumber } from "@/lib/money";
import { getCurrentUserId } from "@/lib/auth-utils";

export async function getAccounts() {
  try {
    const userId = await getCurrentUserId();
    const accounts = await prisma.account.findMany({
      where: { userId },
      include: {
        bank: true,
      },
      orderBy: { name: "asc" },
    });
    return accounts.map((account) => ({
      ...account,
      limit: toNumber(account.limit),
      bank: account.bank ? { ...account.bank, limit: toNumber(account.bank.limit) } : null,
    }));
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
    const userId = await getCurrentUserId();
    const account = await prisma.account.create({
      data: {
        ...rest,
        userId,
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
    const userId = await getCurrentUserId();
    await prisma.account.delete({
      where: { id, userId },
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
    const userId = await getCurrentUserId();
    await prisma.account.update({
      where: { id, userId },
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
    const userId = await getCurrentUserId();
    const card = await prisma.account.findUnique({
      where: { id: cardId, userId },
      include: { bank: true },
    });
    if (!card) return null;

    const { startDate, endDate } = getAccountBillingCycle(card, month, year);

    const [transactions, contas] = await Promise.all([
      prisma.transaction.findMany({
        where: {
          userId,
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
      }),
      prisma.account.findMany({
        where: { type: "CONTA", userId },
        select: { id: true, name: true },
      }),
    ]);

    const contaIds = contas.map(c => c.id);
    const [balances, transfersIn] = await Promise.all([
      prisma.transaction.groupBy({
        by: ["accountId", "type"],
        where: { userId, paid: true, accountId: { in: contaIds } },
        _sum: { amount: true },
      }),
      prisma.transaction.groupBy({
        by: ["destinationAccountId"],
        where: {
          userId,
          paid: true,
          type: "TRANSFER",
          destinationAccountId: { in: contaIds },
        },
        _sum: { amount: true },
      }),
    ]);

    const balanceByAccount = new Map<string, Map<string, number>>();
    for (const item of balances) {
      if (!item.accountId) continue;
      const values = balanceByAccount.get(item.accountId) ?? new Map<string, number>();
      values.set(item.type, toNumber(item._sum.amount));
      balanceByAccount.set(item.accountId, values);
    }

    const transfersInByAccount = new Map(
      transfersIn
        .filter((item) => item.destinationAccountId)
        .map((item) => [item.destinationAccountId as string, toNumber(item._sum.amount)])
    );

    const availableAccounts = contas.map(acc => {
      const values = balanceByAccount.get(acc.id);
      const inc = values?.get("INCOME") ?? 0;
      const exp = values?.get("EXPENSE") ?? 0;
      const tOut = values?.get("TRANSFER") ?? 0;
      const tIn = transfersInByAccount.get(acc.id) ?? 0;
      return {
        id: acc.id,
        name: acc.name,
        balance: inc - exp - tOut + tIn,
      };
    });

    const expenses = transactions.filter((t) => t.type === "EXPENSE");
    const totalSpent = expenses.reduce((sum, t) => sum + toNumber(t.amount), 0);
    const totalPaid = expenses.filter((t) => t.paid).reduce((sum, t) => sum + toNumber(t.amount), 0);
    const limit = toNumber(card.limit);
    
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
      availableAccounts,
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
          amount: toNumber(t.amount),
          date: t.date.toISOString(),
          type: t.type,
          paid: t.paid,
          categoryName: t.category?.name || "Geral",
          categoryColor: t.category?.color || "#b300e4",
          seriesId: t.seriesId,
        })),
      },
    };
  } catch (error) {
    console.error("Error fetching card invoice details:", error);
    return null;
  }
}
