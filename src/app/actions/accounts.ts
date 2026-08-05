"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

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
