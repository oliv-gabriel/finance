import { auth } from "@/auth";

export async function getCurrentUserId() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  return session.user.id;
}

export async function isAdmin() {
  const session = await auth();
  // Altere este e-mail para o e-mail exato do seu usuário
  return session?.user?.email === "gab@example.com" || session?.user?.name === "gab";
}
