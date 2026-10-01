import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import { authAdapter } from "@/lib/authAdapter"
import { verifyPassword } from "@/lib/password"
import { authConfig } from "./auth.config"

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  adapter: authAdapter,
  session: { strategy: "jwt" },
  debug: process.env.AUTH_DEBUG === "true",
  logger: {
    error(error) { console.error("NEXTAUTH_ERROR", error); },
    warn(code) { console.warn("NEXTAUTH_WARN", code); },
    debug(code, metadata) { console.log("NEXTAUTH_DEBUG", code, metadata); }
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.username as string }
        })

        if (!user || !user.password) return null

        const passwordsMatch = verifyPassword(
          credentials.password as string,
          user.password
        )

        if (passwordsMatch) return user

        return null
      }
    })
  ],
})
