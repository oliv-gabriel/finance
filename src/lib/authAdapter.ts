import { PrismaAdapter } from "@auth/prisma-adapter";
import type { Adapter, AdapterAccount, AdapterUser } from "next-auth/adapters";
import { prisma } from "@/lib/prisma";

const prismaAdapter = PrismaAdapter(prisma);

/**
 * The application already has an `Account` model for bank accounts and cards.
 * Auth.js' stock Prisma adapter expects that name to belong to authentication
 * providers, so its account methods must target `AuthAccount` instead.
 */
export const authAdapter: Adapter = {
  ...prismaAdapter,

  async getUserByAccount({ provider, providerAccountId }) {
    const account = await prisma.authAccount.findUnique({
      where: {
        provider_providerAccountId: { provider, providerAccountId },
      },
      include: { user: true },
    });

    return (account?.user as AdapterUser | undefined) ?? null;
  },

  async linkAccount(account) {
    return prisma.authAccount.create({
      data: account,
    }) as Promise<AdapterAccount>;
  },

  async unlinkAccount({ provider, providerAccountId }) {
    return prisma.authAccount.delete({
      where: {
        provider_providerAccountId: { provider, providerAccountId },
      },
    }) as Promise<AdapterAccount>;
  },

  async getAccount(providerAccountId, provider) {
    return prisma.authAccount.findUnique({
      where: {
        provider_providerAccountId: { provider, providerAccountId },
      },
    }) as Promise<AdapterAccount | null>;
  },
};
