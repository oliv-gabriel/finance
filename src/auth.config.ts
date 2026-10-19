import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  secret:
    process.env.AUTH_SECRET ??
    (process.env.NODE_ENV === "development"
      ? "finance-app-local-development-secret"
      : undefined),
  session: {
    strategy: "jwt",
    maxAge: 15 * 60, // 15 minutos
  },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.name = (token.name as string) || (token.email as string) || "";
        session.user.email = (token.email as string) || "";
        (session.user as any).role = (token.role as string) || "USER";
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.email = user.email;
        token.name = user.name || user.email;
        token.role = (user as any).role || "USER";
      }
      return token;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
