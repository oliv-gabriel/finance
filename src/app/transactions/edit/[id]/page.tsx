import { getCategories } from "@/app/actions/categories";
import { getAccounts } from "@/app/actions/accounts";
import TransactionForm from "@/components/transactions/TransactionForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/money";
import { notFound } from "next/navigation";

export default async function EditTransactionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ mode?: string }>;
}) {
  const { id } = await params;
  const { mode } = await searchParams;
  const categories = await getCategories();
  const accounts = await getAccounts();
  
  const transaction = await prisma.transaction.findUnique({
    where: { id },
  });

  if (!transaction) {
    notFound();
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center space-x-2">
        <Link href="/transactions" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Editar Transação</h1>
      </div>

      <TransactionForm 
        categories={categories} 
        accounts={accounts}
        initialData={{ ...transaction, amount: toNumber(transaction.amount) }}
        initialEditMode={mode as any}
      />
    </div>
  );
}
