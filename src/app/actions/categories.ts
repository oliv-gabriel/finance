"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getCategories() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
    });
    return categories;
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
}

export async function createCategory(data: { name: string; color: string; icon: string }) {
  try {
    const category = await prisma.category.create({
      data,
    });
    revalidatePath("/categories");
    revalidatePath("/transactions/new");
    revalidatePath("/transactions");
    revalidatePath("/");
    return { success: true, category };
  } catch (error) {
    console.error("Error creating category:", error);
    return { success: false, error: "Falha ao criar categoria" };
  }
}

export async function updateCategory(id: string, data: { name: string; color: string; icon: string }) {
  try {
    const category = await prisma.category.update({
      where: { id },
      data,
    });
    revalidatePath("/categories");
    revalidatePath("/transactions/new");
    revalidatePath("/transactions");
    revalidatePath("/");
    return { success: true, category };
  } catch (error) {
    console.error("Error updating category:", error);
    return { success: false, error: "Falha ao atualizar categoria" };
  }
}

export async function deleteCategory(id: string) {
  try {
    // Check if there are transactions using this category
    const transactionCount = await prisma.transaction.count({
      where: { categoryId: id },
    });

    if (transactionCount > 0) {
      return { success: false, error: "Não é possível excluir categoria com transações vinculadas" };
    }

    await prisma.category.delete({
      where: { id },
    });
    revalidatePath("/categories");
    revalidatePath("/transactions/new");
    revalidatePath("/transactions");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error deleting category:", error);
    return { success: false, error: "Falha ao excluir categoria" };
  }
}
