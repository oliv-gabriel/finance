"use client";

import { useState } from "react";
import { deleteAllTransactions } from "@/app/actions/transactions";
import { Button } from "@/components/ui/Button";
import { Trash2, Loader2 } from "lucide-react";

export default function DeleteAllTransactionsButton() {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAll = async () => {
    const confirmed = window.confirm(
      "TEM CERTEZA ABSOLUTA? Isso irá apagar TODAS as transações cadastradas. Esta ação não pode ser desfeita."
    );

    if (confirmed) {
      setIsDeleting(true);
      const result = await deleteAllTransactions();
      
      if (!result.success) {
        alert("Erro ao limpar transações: " + result.error);
      }
      setIsDeleting(false);
    }
  };

  return (
    <Button
      variant="destructive"
      onClick={handleDeleteAll}
      disabled={isDeleting}
      className="bg-red-600 hover:bg-red-700 text-white"
    >
      {isDeleting ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <Trash2 className="h-4 w-4 mr-2" />
      )}
      Limpar Tudo
    </Button>
  );
}
