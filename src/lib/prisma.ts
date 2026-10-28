import "server-only";
import { PrismaClient } from "@prisma/client";

const prismaClientSingleton = () => {
  const client = new PrismaClient();
  return client.$extends({
    query: {
      $allModels: {
        async $allOperations({ args, query }) {
          try {
            return await query(args);
          } catch (error: any) {
            // Auto-retry transient connection errors (e.g. Supabase pooler waking up / cold start)
            if (
              error?.code === "P1001" ||
              (typeof error?.message === "string" && error.message.includes("Can't reach database server"))
            ) {
              await new Promise((resolve) => setTimeout(resolve, 800));
              return await query(args);
            }
            throw error;
          }
        },
      },
    },
  });
};

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

export const prisma = globalThis.prisma ?? prismaClientSingleton();

globalThis.prisma = prisma;
