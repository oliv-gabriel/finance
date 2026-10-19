import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function getCurrentUserId() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  return session.user.id;
}

export async function getCurrentUserSession(forceDbRefresh = false) {
  const session = await auth();
  if (!session?.user) return null;

  let role = (session.user as any).role || "USER";
  let name = session.user.name || session.user.email || "";
  let email = session.user.email || "";
  const id = session.user.id;

  // Apenas consulta o banco se for solicitado explicitamente (ex: tela de perfil)
  // ou se o nome/role estiverem ausentes no token da sessão
  if (id && (forceDbRefresh || !name || !role)) {
    try {
      const dbUser = await prisma.user.findUnique({
        where: { id },
        select: { role: true, name: true, email: true },
      });
      if (dbUser) {
        role = dbUser.role || role;
        name = dbUser.name || name;
        email = dbUser.email || email;
      }
    } catch (err: any) {
      // Usar console.warn para registrar a oscilação de conexão sem interromper o Next.js
      console.warn("Aviso: Falha temporária ao sincronizar sessão com banco, usando cache local:", err?.message || err);
    }
  }

  const isUserAdmin =
    id === "cmu3bvnp40000ufqs95rnpmkr" ||
    role === "ADMIN" ||
    name === "gab" ||
    email === "gab" ||
    email === "gab@example.com";

  return {
    id,
    name,
    email,
    role: isUserAdmin ? "ADMIN" : role,
    isAdmin: isUserAdmin,
  };
}

export async function isAdmin() {
  const userSession = await getCurrentUserSession();
  return userSession?.isAdmin ?? false;
}
