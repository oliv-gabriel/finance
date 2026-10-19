"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/password";
import { isAdmin, getCurrentUserSession } from "@/lib/auth-utils";
import { auth } from "@/auth";

export async function getLoggedUserInfo() {
  return await getCurrentUserSession(true);
}

export async function listUsers() {
  const admin = await isAdmin();
  if (!admin) {
    return { error: "Acesso não autorizado." };
  }

  try {
    const rawUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            transactions: true,
            accounts: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const users = rawUsers.map((u) => ({
      ...u,
      createdAt: u.createdAt.toISOString(),
    }));

    return { success: true, users };
  } catch (error) {
    console.error("Erro ao listar usuários:", error);
    return { error: "Erro ao buscar lista de usuários." };
  }
}

export async function registerUser(formData: FormData) {
  const username = (formData.get("username") as string)?.trim();
  const password = formData.get("password") as string;
  const role = ((formData.get("role") as string) || "USER").toUpperCase();

  if (!username || !password) {
    return { error: "Nome de usuário e senha são obrigatórios." };
  }

  if (password.length < 6) {
    return { error: "A senha deve ter no mínimo 6 caracteres." };
  }

  try {
    // Se estiver tentando criar diretamente como ADMIN, verifica permissão
    if (role === "ADMIN") {
      const admin = await isAdmin();
      if (!admin) {
        return { error: "Apenas administradores podem conceder privilégios de administrador." };
      }
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: username },
    });

    if (existingUser) {
      return { error: "Nome de usuário já está em uso." };
    }

    const hashedPassword = hashPassword(password);

    await prisma.user.create({
      data: {
        email: username,
        password: hashedPassword,
        name: username,
        role: role === "ADMIN" ? "ADMIN" : "USER",
      },
    });

    revalidatePath("/admin");
    revalidatePath("/profile");
    return { success: true };
  } catch (error) {
    console.error("Erro ao registrar usuário:", error);
    return { error: "Ocorreu um erro ao criar a conta." };
  }
}

export async function toggleUserRole(userId: string, newRole: "ADMIN" | "USER") {
  const admin = await isAdmin();
  if (!admin) {
    return { error: "Acesso não autorizado." };
  }

  try {
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    });

    if (!targetUser) {
      return { error: "Usuário não encontrado." };
    }

    if (
      (targetUser.id === "cmu3bvnp40000ufqs95rnpmkr" ||
        targetUser.name === "gab" ||
        targetUser.email === "gab") &&
      newRole !== "ADMIN"
    ) {
      return { error: "O usuário mestre não pode perder o acesso de Administrador." };
    }

    await prisma.user.update({
      where: { id: userId },
      data: { role: newRole },
    });

    revalidatePath("/admin");
    revalidatePath("/profile");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Erro ao alterar papel do usuário:", error);
    return { error: "Não foi possível atualizar o nível de acesso do usuário." };
  }
}

export async function adminChangePassword(userId: string, newPassword: string) {
  const admin = await isAdmin();
  if (!admin) {
    return { error: "Acesso não autorizado." };
  }

  if (!newPassword || newPassword.length < 6) {
    return { error: "A nova senha deve ter no mínimo 6 caracteres." };
  }

  try {
    const hashedPassword = hashPassword(newPassword);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    revalidatePath("/admin");
    revalidatePath("/profile");
    return { success: true };
  } catch (error) {
    console.error("Erro ao alterar senha do usuário:", error);
    return { error: "Erro ao trocar a senha do usuário." };
  }
}

export async function changeOwnPassword(currentPassword: string, newPassword: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Não autenticado." };
  }

  if (!newPassword || newPassword.length < 6) {
    return { error: "A nova senha deve ter no mínimo 6 caracteres." };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user || !user.password) {
      return { error: "Usuário não encontrado ou sem senha registrada." };
    }

    const isValid = verifyPassword(currentPassword, user.password);
    if (!isValid) {
      return { error: "A senha atual está incorreta." };
    }

    const hashedPassword = hashPassword(newPassword);

    await prisma.user.update({
      where: { id: session.user.id },
      data: { password: hashedPassword },
    });

    return { success: true };
  } catch (error) {
    console.error("Erro ao trocar senha pessoal:", error);
    return { error: "Ocorreu um erro ao atualizar sua senha." };
  }
}

export async function deleteUser(userId: string) {
  const admin = await isAdmin();
  if (!admin) {
    return { error: "Acesso não autorizado." };
  }

  const session = await auth();

  try {
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    });

    if (!targetUser) {
      return { error: "Usuário não encontrado." };
    }

    if (
      targetUser.id === "cmu3bvnp40000ufqs95rnpmkr" ||
      targetUser.name === "gab" ||
      targetUser.email === "gab"
    ) {
      return { error: "O usuário mestre não pode ser excluído." };
    }

    if (session?.user?.id === userId) {
      return { error: "Você não pode excluir sua própria conta enquanto estiver logado nela." };
    }

    await prisma.user.delete({
      where: { id: userId },
    });

    revalidatePath("/admin");
    revalidatePath("/profile");
    return { success: true };
  } catch (error) {
    console.error("Erro ao excluir usuário:", error);
    return { error: "Erro ao excluir usuário." };
  }
}

export async function updateUsername(newUsername: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Não autenticado." };
  }

  const cleanUsername = newUsername.trim().toLowerCase().replace(/\s+/g, "_");

  if (!cleanUsername || cleanUsername.length < 3) {
    return { error: "O nome de usuário deve ter no mínimo 3 caracteres." };
  }

  // Permite apenas letras, números e underlines
  if (!/^[a-z0-9_]+$/.test(cleanUsername)) {
    return { error: "O nome de usuário deve conter apenas letras, números e underline (_)." };
  }

  try {
    const existing = await prisma.user.findFirst({
      where: {
        email: cleanUsername,
        NOT: { id: session.user.id },
      },
    });

    if (existing) {
      return { error: "Este nome de usuário já está em uso." };
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: cleanUsername,
        email: cleanUsername,
      },
    });

    revalidatePath("/profile");
    revalidatePath("/");
    return { success: true, username: cleanUsername };
  } catch (error) {
    console.error("Erro ao atualizar nome de usuário:", error);
    return { error: "Ocorreu um erro ao atualizar o nome de usuário." };
  }
}
