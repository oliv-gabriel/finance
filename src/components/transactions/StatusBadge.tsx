"use client";

import { toggleTransactionPaid } from "@/app/actions/transactions";
import { useState } from "react";

interface StatusBadgeProps {
  id: string;
  initialPaid: boolean;
}

export default function StatusBadge({ id, initialPaid }: StatusBadgeProps) {
  const [isPaid, setIsPaid] = useState(initialPaid);
  const [isPending, setIsPending] = useState(false);

  const handleToggle = async () => {
    if (isPending) return;
    
    setIsPending(true);
    const newStatus = !isPaid;
    const result = await toggleTransactionPaid(id, newStatus);
    
    if (result.success) {
      setIsPaid(newStatus);
    } else {
      alert("Falha ao atualizar status");
    }
    setIsPending(false);
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors cursor-pointer hover:opacity-80 disabled:opacity-50 ${
        isPaid 
          ? "bg-green-100 text-green-800" 
          : "bg-yellow-100 text-yellow-800"
      }`}
      title={isPaid ? "Clique para marcar como pendente" : "Clique para marcar como pago"}
    >
      {isPaid ? "Pago" : "Pendente"}
    </button>
  );
}
