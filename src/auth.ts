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
        id: process.env.NODE_ENV === "production" ? "finance-gamma-umber.vercel.app" : "localhost",
        name: "Finance App",
        origin: process.env.NODE_ENV === "production" ? "https://finance-gamma-umber.vercel.app" : "http://localhost:3000",
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
