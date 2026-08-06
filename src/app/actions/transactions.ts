"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getAccountBillingCycle, getTransactionWhereForMonth } from "@/lib/billingCycles";

export async function getTransactions(options?: {
  categoryId?: string;
  type?: "INCOME" | "EXPENSE";
  limit?: number;
  month?: number;
  year?: number;
}) {
  try {
    let monthFilter: any = {};
    if (options?.month && options?.year) {
      const allAccounts = await prisma.account.findMany();
      monthFilter = getTransactionWhereForMonth(options.month, options.year, allAccounts);
    }

    const transactions = await prisma.transaction.findMany({
      where: {
        categoryId: options?.categoryId,
        type: options?.type,
        ...monthFilter,
      },
      include: {
        category: true,
        account: true,
      },
      orderBy: { date: "desc" },
      take: options?.limit,
    });
    return transactions;
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return [];
  }
}

export async function createTransaction(data: {
  amount: number;
  description: string;
  date: Date;
  type: string;
  categoryId: string;
  paid: boolean;
  accountId: string;
  entryType?: string;
  recurrenceFreq?: string;
  quantity?: number;
  installmentValueType?: string;
}) {
  try {
    const { entryType, recurrenceFreq, quantity, installmentValueType, ...transactionData } = data;

    const account = await prisma.account.findUnique({
      where: { id: transactionData.accountId },
    });

    if (account && entryType && entryType !== "unico" && quantity && quantity > 1) {
      const transactionsToCreate = [];
      const baseDate = new Date(transactionData.date);

      for (let i = 0; i < quantity; i++) {
        let newDate = new Date(baseDate);
        if (recurrenceFreq === "Mensal") {
          newDate.setMonth(newDate.getMonth() + i);
        } else if (recurrenceFreq === "Bimestral") {
          newDate.setMonth(newDate.getMonth() + (i * 2));
        } else if (recurrenceFreq === "Quinzenal") {
          newDate.setDate(newDate.getDate() + (i * 15));
        }

        let amount = transactionData.amount;
        let description = transactionData.description;

        if (entryType === "parcelado") {
          amount = installmentValueType === "parcela" ? transactionData.amount : (transactionData.amount / quantity);
          description = `${transactionData.description} (${i + 1}/${quantity})`;
        } else if (entryType === "recorrente") {
          description = `${transactionData.description} (${i + 1}/${quantity})`;
        }

        transactionsToCreate.push({
          ...transactionData,
          amount,
          description,
          date: newDate,
          paid: i === 0 ? transactionData.paid : false,
        });
      }

      await prisma.transaction.createMany({
        data: transactionsToCreate,
      });

      revalidatePath("/transactions");
      revalidatePath("/");
      return { success: true };
    } else {
      const transaction = await prisma.transaction.create({
        data: transactionData,
      });
      revalidatePath("/transactions");
      revalidatePath("/");
      return { success: true, transaction };
    }
  } catch (error) {
    console.error("Error creating transaction:", error);
    return { success: false, error: "Falha ao criar transação" };
  }
}

export async function updateTransaction(
  id: string,
  data: {
    amount: number;
    description: string;
    date: Date;
    type: string;
    categoryId: string;
    paid: boolean;
    accountId: string;
    entryType?: string;
    recurrenceFreq?: string;
    quantity?: number;
    installmentValueType?: string;
  },
  updateAllInSeries?: boolean
) {
  try {
    const { entryType, recurrenceFreq, quantity, installmentValueType, ...updateData } = data;
    
    if (updateAllInSeries) {
      const target = await prisma.transaction.findUnique({ where: { id } });
      if (target) {
        let baseDescription = target.description;
        const match = target.description.match(/^(.*?)\s*\(\d+\/\d+\)$/);
        if (match) baseDescription = match[1].trim();
        
        const related = await prisma.transaction.findMany({
          where: {
            accountId: target.accountId,
            categoryId: target.categoryId,
            description: { startsWith: baseDescription },
          },
          orderBy: { date: "asc" },
        });

        let newBaseDesc = updateData.description;
        const newMatch = newBaseDesc.match(/^(.*?)\s*\(\d+\/\d+\)$/);
        if (newMatch) newBaseDesc = newMatch[1].trim();

        for (let i = 0; i < related.length; i++) {
          const item = related[i];
          const hasSuffix = /\(\d+\/\d+\)$/.test(item.description);
          const itemDesc = hasSuffix ? `${newBaseDesc} (${i + 1}/${related.length})` : updateData.description;
          
          await prisma.transaction.update({
            where: { id: item.id },
            data: {
              amount: updateData.amount,
              categoryId: updateData.categoryId,
              accountId: updateData.accountId,
              type: updateData.type,
              description: itemDesc,
            },
          });
        }
        revalidatePath("/transactions");
        revalidatePath("/");
        return { success: true, transaction: target };
      }
    }

    const transaction = await prisma.transaction.update({
      where: { id },
      data: updateData,
    });
    revalidatePath("/transactions");
    revalidatePath("/");
    return { success: true, transaction };
  } catch (error) {
    console.error("Error updating transaction:", error);
    return { success: false, error: "Falha ao atualizar transação" };
  }
}

// Action updated to use standard Prisma Client
export async function toggleTransactionPaid(id: string, paid: boolean) {
  try {
    await prisma.transaction.update({
      where: { id },
      data: { paid },
    });
    revalidatePath("/transactions");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("Action toggleTransactionPaid failed:", error);
    return { success: false, error: "Falha ao atualizar status" };
  }
}

export async function deleteAllTransactions() {
  try {
    await prisma.transaction.deleteMany();
    revalidatePath("/transactions");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error deleting all transactions:", error);
    return { success: false, error: "Falha ao limpar transações" };
  }
}

export async function deleteTransaction(id: string, deleteAllInSeries?: boolean) {
  try {
    if (deleteAllInSeries) {
      const target = await prisma.transaction.findUnique({ where: { id } });
      if (target) {
        let baseDescription = target.description;
        const match = target.description.match(/^(.*?)\s*\(\d+\/\d+\)$/);
        if (match) baseDescription = match[1].trim();
        
        await prisma.transaction.deleteMany({
          where: {
            accountId: target.accountId,
            categoryId: target.categoryId,
            description: { startsWith: baseDescription },
          },
        });
        revalidatePath("/transactions");
        revalidatePath("/");
        return { success: true };
      }
    }

    await prisma.transaction.delete({
      where: { id },
    });
    revalidatePath("/transactions");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error deleting transaction:", error);
    return { success: false, error: "Falha ao excluir transação" };
  }
}

export async function payCardBill(cardId: string, month: number, year: number) {
  try {
    const card = await prisma.account.findUnique({ where: { id: cardId } });
    const { startDate, endDate } = getAccountBillingCycle(card || { type: "" }, month, year);

    await prisma.transaction.updateMany({
      where: {
        accountId: cardId,
        date: {
          gte: startDate,
          lte: endDate,
        },
        type: "EXPENSE",
        paid: false,
      },
      data: {
        paid: true,
      },
    });

    revalidatePath("/");
    revalidatePath("/transactions");
    return { success: true };
  } catch (error) {
    console.error("Error paying card bill:", error);
    return { success: false, error: "Falha ao pagar fatura" };
  }
}
