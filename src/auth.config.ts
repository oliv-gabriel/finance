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
  experimental: {
    enableWebAuthn: true,
  },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.email = user.email;
      }
      return token;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
