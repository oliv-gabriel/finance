"use client";

import { useState } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { deleteTransaction } from "@/app/actions/transactions";

interface DeleteTransactionButtonProps {
  id: string;
}

export default function DeleteTransactionButton({ id }: DeleteTransactionButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Tem certeza que deseja excluir esta transação?")) {
      return;
    }

    setIsDeleting(true);
    try {
      const result = await deleteTransaction(id);
      if (!result.success) {
        alert(result.error || "Erro ao excluir transação");
      }
    } catch (error) {
      console.error(error);
      alert("Ocorreu um erro ao tentar excluir a transação.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className="text-red-500 hover:text-red-700 hover:bg-red-50 border-red-100 h-8 w-8 p-0"
      onClick={handleDelete}
      disabled={isDeleting}
      title="Excluir transação"
    >
      {isDeleting ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Trash2 className="h-4 w-4" />
      )}
    </Button>
  );
}
