"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function registerUser(formData: FormData) {
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;

  if (!username || !password) {
    return { error: "Nome de usuário e senha são obrigatórios." };
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email: username },
    });

    if (existingUser) {
      return { error: "Nome de usuário já está em uso." };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        email: username,
        password: hashedPassword,
        name: username,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Erro ao registrar usuário:", error);
    return { error: "Ocorreu um erro ao criar a conta." };
  }
}
