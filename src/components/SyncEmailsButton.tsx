"use client";

import { useState } from "react";
import { syncEmails } from "@/app/actions/emailSync";
import { RefreshCw, Loader2, Check } from "lucide-react";

export default function SyncEmailsButton() {
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [count, setCount] = useState(0);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleSync = async () => {
        setStatus("loading");
        setErrorMessage(null);
        
        try {
            const result = await syncEmails();

            if (result.success) {
                setCount(result.count || 0);
                setStatus("success");
                setTimeout(() => setStatus("idle"), 5000);
            } else {
                setStatus("error");
                setErrorMessage(result.error || "Falha de autenticação IMAP");
                setTimeout(() => {
                    setStatus("idle");
                    setErrorMessage(null);
                }, 5000);
            }
        } catch (err) {
            setStatus("error");
            setErrorMessage("Serviço indisponível no momento");
            setTimeout(() => {
                setStatus("idle");
                setErrorMessage(null);
            }, 5000);
        }
    };

    return (
        <button
            onClick={handleSync}
            disabled={status === "loading"}
            title={
                status === "loading"
                    ? "Sincronizando 99Pay..."
                    : status === "success"
                    ? count === 0 ? "Tudo atualizado!" : `${count} novas transações da 99Pay sincronizadas!`
                    : status === "error"
                    ? `Erro ao sincronizar: ${errorMessage || "Falha IMAP"}`
                    : "Sincronizar 99Pay (PIX e Corridas)"
            }
            className={`group inline-flex items-center justify-center gap-1.5 h-10 px-3 min-w-10 rounded-xl text-xs font-semibold border transition-all duration-300 cursor-pointer disabled:cursor-wait ${
                status === "loading"
                    ? "bg-[#b300e4]/15 text-[#b300e4] border-[#b300e4]/40 shadow-sm shadow-[#b300e4]/20"
                    : status === "success"
                    ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 shadow-2xs"
                    : status === "error"
                    ? "bg-red-500/15 text-red-400 border-red-500/30"
                    : "bg-card/80 hover:bg-card text-muted-foreground hover:text-[#b300e4] border-border/80 hover:border-[#b300e4]/50 hover:shadow-xs"
            }`}
        >
            {status === "loading" ? (
                <Loader2 className="h-4 w-4 animate-spin text-[#b300e4]" />
            ) : status === "success" ? (
                <>
                    <Check className="h-4 w-4 text-emerald-400" />
                    {count > 0 && <span>+{count}</span>}
                </>
            ) : status === "error" ? (
                <>
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                </>
            ) : (
                <RefreshCw className="h-4 w-4 transition-transform duration-500 group-hover:rotate-180" />
            )}
        </button>
    );
}
