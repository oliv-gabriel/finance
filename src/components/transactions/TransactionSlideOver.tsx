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
        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={closeSlideOver}
      />
      
      {/* Slide-over panel */}
      <div className="fixed inset-y-0 right-0 z-[100] w-full max-w-md bg-card shadow-2xl transition-transform duration-300 transform translate-x-0 flex flex-col border-l border-border/50">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/40">
          <h2 className="text-xl font-bold tracking-tight text-foreground">Criar Transação</h2>
          <button 
            onClick={closeSlideOver}
            className="p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
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
