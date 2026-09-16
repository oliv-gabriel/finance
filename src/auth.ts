import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import Passkey from "next-auth/providers/passkey"
import { prisma } from "@/lib/prisma"
import { authAdapter } from "@/lib/authAdapter"
import bcrypt from "bcryptjs"
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
  experimental: {
    enableWebAuthn: true,
  },
  providers: [
    // Auth.js derives the RP ID and origin from AUTH_URL (or the request URL).
    // Keeping these values dynamic makes localhost and Vercel use the same flow.
    Passkey({
      name: "Finance App",
      relayingParty: { name: "Finance App" },
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
