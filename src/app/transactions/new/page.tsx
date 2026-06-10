import { getCategories } from "@/app/actions/categories";
import { getAccounts } from "@/app/actions/accounts";
import TransactionForm from "@/components/transactions/TransactionForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function NewTransactionPage() {
  const categories = await getCategories();
  const accounts = await getAccounts();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center space-x-2">
        <Link href="/transactions" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Nova Transação</h1>
      </div>

      <TransactionForm categories={categories} accounts={accounts} />
    </div>
  );
}
