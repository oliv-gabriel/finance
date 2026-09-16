import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import Passkey from "next-auth/providers/passkey"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { authConfig } from "./auth.config"

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  experimental: {
    enableWebAuthn: true,
  },
  providers: [
    Passkey({
      relayingParty: {
        id: process.env.AUTH_URL ? new URL(process.env.AUTH_URL).hostname : (process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL || "localhost"),
        name: "Finance App",
        origin: process.env.AUTH_URL ? process.env.AUTH_URL : (process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL}` : "http://localhost:3000"),
      }
    }),
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

        const passwordsMatch = await bcrypt.compare(
          credentials.password as string,
          user.password
        )

        if (passwordsMatch) return user

        return null
      }
    })
  ],
})
