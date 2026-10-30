"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { X } from "lucide-react";
import TransactionForm from "./TransactionForm";
import { getCategories } from "@/app/actions/categories";
import { getAccounts } from "@/app/actions/accounts";

export default function TransactionSlideOver() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  
  const isOpen = searchParams.get("newTransaction") === "true";

  const [categories, setCategories] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      Promise.all([getCategories(), getAccounts()]).then(([cats, accs]) => {
        setCategories(cats);
        setAccounts(accs);
        setLoading(false);
      });
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const closeSlideOver = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("newTransaction");
    router.push(`${pathname}?${params.toString()}`);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={closeSlideOver}
      />
      
      {/* Slide-over / Bottom-sheet Container */}
      <div className="fixed inset-x-0 bottom-0 z-[100] w-full max-h-[92dvh] sm:max-h-full sm:inset-y-0 sm:left-auto sm:right-0 sm:max-w-md bg-card shadow-2xl transition-all duration-300 flex flex-col rounded-t-3xl sm:rounded-none border-t sm:border-t-0 sm:border-l border-border/60 animate-in slide-in-from-bottom sm:slide-in-from-right duration-300">
        
        {/* Mobile Drag Indicator */}
        <div className="w-12 h-1.5 rounded-full bg-zinc-700/60 mx-auto mt-3 mb-1 sm:hidden shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 sm:py-4 border-b border-border/40 shrink-0">
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">Criar Transação</h2>
          <button 
            onClick={closeSlideOver}
            className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="size-8 border-4 border-muted-foreground/30 border-t-[#b300e4] rounded-full animate-spin" />
          </div>
        ) : (
          <TransactionForm 
            categories={categories} 
            accounts={accounts} 
            isModal={true}
            onSuccess={closeSlideOver}
            onCancel={closeSlideOver}
          />
        )}
      </div>
    </>
  );
}
